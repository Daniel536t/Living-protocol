const { ethers } = require("ethers");

function validateIdentity({ identity, delegation, execution }) {
  if (!ethers.isAddress(identity.delegationManager)) throw new Error("Invalid DelegationManager");
  if (!ethers.isAddress(identity.entryPoint)) throw new Error("Invalid EntryPoint");
  if (!ethers.isAddress(identity.relayer)) throw new Error("Invalid Relayer");
  if (!delegation.delegate) throw new Error("Missing delegate");
  if (!delegation.delegator) throw new Error("Missing delegator");
  if (!execution.target) throw new Error("Missing execution target");
  if (!execution.callData) throw new Error("Missing callData");
  return true;
}

module.exports = { validateIdentity };
