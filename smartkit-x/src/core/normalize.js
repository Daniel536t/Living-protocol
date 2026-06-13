const { ethers } = require("ethers");
function toHex32(value) {
  if (!value) return ethers.ZeroHash;
  if (typeof value === "string" && value.startsWith("0x")) return ethers.zeroPadValue(value, 32);
  return ethers.zeroPadValue(ethers.hexlify(value), 32);
}
function normalizeDelegation(d) {
  return {
    delegate: d.delegate || d.to, delegator: d.delegator || d.from,
    authority: toHex32(d.authority),
    caveats: d.caveats ? toHex32(typeof d.caveats === "string" ? d.caveats : ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(d.caveats)))) : ethers.ZeroHash,
    salt: d.salt && d.salt.startsWith("0x") ? ethers.zeroPadValue(d.salt, 32) : ethers.hexlify(ethers.randomBytes(32)),
    validUntil: d.validUntil || Math.floor(Date.now() / 1000) + 3600,
  };
}
function normalizeExecution(e) {
  if (!e || !e.target || !e.data) throw new Error("Invalid execution object");
  return { target: e.target, data: e.data, value: e.value == null ? "0" : String(e.value) };
}
module.exports = { normalizeDelegation, normalizeExecution };
