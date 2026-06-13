const { ethers } = require("ethers");
const { createDelegation, getSmartAccountsEnvironment, ScopeType } = require("@metamask/smart-accounts-kit");

function buildDelegation({ privateKey, chainId, relayerTarget, targetContract, functionAbi }) {
  const wallet = new ethers.Wallet(privateKey);
  const iface = new ethers.Interface(functionAbi);
  const env = getSmartAccountsEnvironment(chainId);

  const delegation = createDelegation({
    from: wallet.address,
    to: relayerTarget,
    environment: env,
    scope: {
      type: ScopeType.FunctionCall,
      targets: [targetContract],
      selectors: [iface.getFunction("storePattern").format("sighash")],
    },
    salt: ethers.hexlify(ethers.randomBytes(32)),
    validUntil: Math.floor(Date.now() / 1000) + 3600,
  });

  return { wallet, env, iface, delegation };
}

module.exports = { buildDelegation };
