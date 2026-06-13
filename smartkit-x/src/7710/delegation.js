const { getSmartAccountsEnvironment, createDelegation, ScopeType } = require("@metamask/smart-accounts-kit");

function build7710Delegation({ wallet, chainId, to, targets, selectors }) {
  const env = getSmartAccountsEnvironment(chainId);
  const delegation = createDelegation({
    from: wallet.address, to, environment: env,
    scope: { type: ScopeType.FunctionCall, targets, selectors },
    salt: "0x" + Math.random().toString(16).slice(2).padStart(64, "0"),
    validUntil: Math.floor(Date.now() / 1000) + 3600,
  });
  return { delegation, env };
}
module.exports = { build7710Delegation };
