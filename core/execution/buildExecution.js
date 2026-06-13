function buildExecution({ target, callData }) {
  if (!target) throw new Error("missing target");
  if (!callData) throw new Error("missing callData");
  return { callType: "call", target, callData, value: "0x0" };
}
module.exports = { buildExecution };
