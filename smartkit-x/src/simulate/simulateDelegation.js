function simulateDelegation({ delegation, signature }) {
  var issues = [];
  if (!delegation.delegate) issues.push("missing delegate");
  if (!delegation.delegator) issues.push("missing delegator");
  if (!delegation.salt) issues.push("missing salt");
  if (!signature || typeof signature !== "string") issues.push("missing signature");
  if (signature && !signature.startsWith("0x")) issues.push("invalid signature format");
  return { valid: issues.length === 0, issues: issues, delegation: delegation };
}
module.exports = { simulateDelegation };
