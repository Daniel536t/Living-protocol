class SDKError extends Error {
  constructor(message, data) { super(message); this.data = data; }
}
const assertAddress = (v, name) => { if (!v || typeof v !== "string" || !v.startsWith("0x")) throw new SDKError("Invalid address: " + name, { value: v }); };
const assertHex = (v, name) => { if (!v || typeof v !== "string" || !v.startsWith("0x")) throw new SDKError("Invalid hex: " + name, { value: v }); };
module.exports = { SDKError, assertAddress, assertHex };
