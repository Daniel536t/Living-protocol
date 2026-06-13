const { getSmartAccountsEnvironment } = require("@metamask/smart-accounts-kit");

function resolveIdentity(chainId, relayerTarget) {
  const env = getSmartAccountsEnvironment(chainId);
  if (!env.DelegationManager) throw new Error("Missing DelegationManager");
  if (!env.EntryPoint) throw new Error("Missing EntryPoint");

  return {
    delegationManager: env.DelegationManager,
    entryPoint: env.EntryPoint,
    relayer: relayerTarget,
    verifyingContract: env.DelegationManager,
    executionRouter: env.EntryPoint,
    transport: relayerTarget,
  };
}

module.exports = { resolveIdentity };
