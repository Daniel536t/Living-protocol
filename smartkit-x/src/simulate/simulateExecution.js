function simulateExecution({ executions, chain }) {
  if (!executions || !Array.isArray(executions)) throw new Error("[Sim] Executions must be array");
  var results = [];
  for (var i = 0; i < executions.length; i++) {
    var exec = executions[i];
    var issues = [];
    if (!exec.target || typeof exec.target !== "string") issues.push("missing target");
    if (!exec.data || exec.data === "0x") issues.push("empty calldata");
    results.push({ execution: exec, valid: issues.length === 0, issues: issues });
  }
  return { valid: results.every(function(r) { return r.valid; }), results: results, chain: chain.name };
}
module.exports = { simulateExecution };
