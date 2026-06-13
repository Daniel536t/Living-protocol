const { ethers } = require("ethers");

function validateAddress(v, name) { if (!ethers.isAddress(v)) throw new Error("[Schema] Invalid address: " + name); }
function validateExecution(e) { validateAddress(e.target, "execution.target"); if (!e.data || typeof e.data !== "string") throw new Error("[Schema] Invalid execution.data"); }
function validateDelegation(d) { validateAddress(d.delegate, "delegation.delegate"); validateAddress(d.delegator, "delegation.delegator"); if (!d.salt) throw new Error("[Schema] Missing salt"); }
function validateTransaction(tx) {
  if (!Array.isArray(tx.executions)) throw new Error("[Schema] executions must be array");
  tx.executions.forEach(validateExecution);
  if (!Array.isArray(tx.permissionContext)) throw new Error("[Schema] permissionContext must be array");
}
module.exports = { validateExecution, validateDelegation, validateTransaction };
