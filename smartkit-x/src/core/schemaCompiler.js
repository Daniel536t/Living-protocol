function compileExecution(call) {
  if (!call || !call.to || !call.data) throw new Error("[Schema] Invalid execution call");
  return { target: call.to, data: call.data, value: call.value == null ? "0" : String(call.value) };
}
function compileExecutions(calls) { return (calls || []).map(compileExecution); }
function compileDelegation(d) {
  if (!d.delegate || !d.delegator) throw new Error("[Schema] Invalid delegation");
  return { delegate: d.delegate, delegator: d.delegator, authority: d.authority || "0x" + "0".repeat(64), caveats: d.caveats || [], salt: d.salt || "0x" + "0".repeat(64), validUntil: d.validUntil || Math.floor(Date.now() / 1000) + 3600 };
}
module.exports = { compileExecution, compileExecutions, compileDelegation };
