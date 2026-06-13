function buildExecution(options) {
  var target = options.target;
  var callData = options.callData;
  if (!target || !callData) throw new Error("[ExecutionBuilder] Missing target or callData");
  return { callType: "call", target: target, callData: callData, value: "0x0" };
}
module.exports = { buildExecution };
