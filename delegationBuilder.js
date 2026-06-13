const { ethers } = require("ethers");
const { createDelegation, getSmartAccountsEnvironment, ScopeType } = require("@metamask/smart-accounts-kit");

function assertAddress(addr, name) {
  if (!addr || !ethers.isAddress(addr)) {
    throw new Error("[DelegationBuilder] Invalid " + name + ": " + addr);
  }
}

function buildDelegation(options) {
  var chainId = options.chainId;
  var privateKey = options.privateKey;
  var relayerTarget = options.relayerTarget;
  var targetContract = options.targetContract;
  var functionAbi = options.functionAbi;

  var wallet = new ethers.Wallet(privateKey);
  var env = getSmartAccountsEnvironment(chainId);

  assertAddress(wallet.address, "wallet.address");
  assertAddress(relayerTarget, "relayerTarget");
  assertAddress(targetContract, "targetContract");

  var iface = new ethers.Interface(functionAbi);
  var selector = iface.getFunction(iface.fragments[0].name).format("sighash");

  var delegation = createDelegation({
    from: wallet.address,
    to: relayerTarget,
    environment: env,
    scope: {
      type: ScopeType.FunctionCall,
      targets: [targetContract],
      selectors: [selector],
    },
    salt: ethers.hexlify(ethers.randomBytes(32)),
    validUntil: Math.floor(Date.now() / 1000) + 3600,
  });

  return { wallet: wallet, env: env, iface: iface, delegation: delegation };
}

module.exports = { buildDelegation };
