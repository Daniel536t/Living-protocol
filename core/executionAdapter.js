function createExecution(target, callData) {
  return { callType: "call", target, callData, value: "0x0" };
}
module.exports = { createExecution };
