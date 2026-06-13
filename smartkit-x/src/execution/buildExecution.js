function buildExecutions(calls) {
  if (!Array.isArray(calls)) throw new Error("calls must be array");
  return calls.map(c => {
    if (!c.to || !c.data) throw new Error("invalid execution");
    return { target: c.to, value: "0x0", data: c.data };
  });
}
module.exports = { buildExecutions };
