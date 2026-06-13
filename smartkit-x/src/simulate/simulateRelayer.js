async function simulateRelayer(payload) {
  var issues = [];
  if (!payload || !payload.method) issues.push("missing method");
  // params can be object OR array
  var params = payload && payload.params;
  if (!params) issues.push("missing params");
  var tx = params && (Array.isArray(params) ? params[0] : params) && params.transactions && params.transactions[0];
  if (!tx) issues.push("missing transactions");
  if (tx && !tx.executions) issues.push("missing executions");
  if (tx && !tx.permissionContext) issues.push("missing permissionContext");
  return { valid: issues.length === 0, issues: issues };
}
module.exports = { simulateRelayer };
