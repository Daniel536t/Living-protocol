function strictExecution(target, callData) {
  if (!target) throw new Error("Missing target");
  if (!callData) throw new Error("Missing callData");
  return { callType: "call", target: target, callData: callData, value: "0x0" };
}
module.exports = { strictExecution };
