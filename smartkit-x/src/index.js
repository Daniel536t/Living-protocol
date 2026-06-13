const { ethers } = require("ethers");
const { assertChain } = require("./core/chains");
const { compileExecutions, compileDelegation } = require("./core/schemaCompiler");
const { preflight } = require("./core/preflight");
const { route } = require("./transport/router");
const { build7702Authorization } = require("./7702/authorize");
const { build7710Delegation } = require("./7710/delegation");
const { simulateExecution } = require("./simulate/simulateExecution");
const { simulateDelegation } = require("./simulate/simulateDelegation");
const { validateTransaction } = require("./schema/validate");

function createSmartKit(config) {
  function createClient() {
    return {
      execute: async function(input) {
        if (!input.wallet) throw new Error("[Client] wallet required");
        if (!input.chainId) throw new Error("[Client] chainId required");
        // Convert {to, data} calls to execution format
        var calls = (input.calls || []).map(function(c) {
          return { to: c.to, data: c.data, value: "0" };
        });
        return _execute({
          wallet: input.wallet, chainId: input.chainId, contract: input.contract,
          calls: calls, targets: input.targets, selectors: input.selectors,
        });
      }
    };
  }

  async function _execute({ wallet, chainId, contract, calls, targets, selectors }) {
    const chain = assertChain(chainId);
    const authBuilder = build7702Authorization({ wallet, contract, chainId, provider: config.provider });
    const authorizationList = await authBuilder();
    const { delegation, env } = build7710Delegation({ wallet, chainId, to: config.relayerTarget, targets, selectors });
    const cleanDelegation = compileDelegation(delegation);
    const executions = compileExecutions(calls);
    preflight({ chain, executions });
    const simExec = simulateExecution({ executions, chain });
    if (!simExec.valid) throw new Error("[SimExecution] Invalid: " + JSON.stringify(simExec.results));
    const signature = await wallet.signTypedData(
      { name: "DelegationManager", version: "1", chainId, verifyingContract: env.DelegationManager },
      { Delegation: [{ name: "delegate", type: "address" }, { name: "delegator", type: "address" }, { name: "authority", type: "bytes32" }, { name: "caveats", type: "bytes32" }, { name: "salt", type: "bytes32" }, { name: "validUntil", type: "uint256" }] },
      { delegate: cleanDelegation.delegate, delegator: cleanDelegation.delegator, authority: cleanDelegation.authority, caveats: ethers.ZeroHash, salt: cleanDelegation.salt, validUntil: cleanDelegation.validUntil }
    );
    const permissionContext = [{ delegate: cleanDelegation.delegate, delegator: cleanDelegation.delegator, authority: cleanDelegation.authority, caveats: [], salt: cleanDelegation.salt, signature }];
    const simDel = simulateDelegation({ delegation: cleanDelegation, signature });
    if (!simDel.valid) throw new Error("[SimDelegation] Invalid: " + JSON.stringify(simDel.issues));
    validateTransaction({ executions, permissionContext });
    return route({ chainId, executions, permissionContext, authorizationList });
  }

  return { client: createClient() };
}

module.exports = { createSmartKit };
