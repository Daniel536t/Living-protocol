function preflight({ chain, executions }) {
  if (!chain) throw new Error("[Preflight] Missing chain config");
  if (!executions || !executions.length) throw new Error("[Preflight] No executions");
  for (var i = 0; i < executions.length; i++) {
    if (!executions[i].target || !executions[i].data) throw new Error("[Preflight] Malformed execution at index " + i);
  }
  return true;
}
module.exports = { preflight };
