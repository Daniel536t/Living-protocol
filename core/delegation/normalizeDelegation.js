const { ethers } = require("ethers");

function normalizeDelegation(d) {
  return {
    delegate: ethers.getAddress(d.delegate),
    delegator: ethers.getAddress(d.delegator),
    authority: d.authority || ethers.ZeroHash,
    salt: d.salt || ethers.hexlify(ethers.randomBytes(32)),
    caveats: Array.isArray(d.caveats)
      ? d.caveats.map(function(c) {
          return {
            enforcer: ethers.getAddress(c.enforcer),
            terms: c.terms,
            args: c.args || "0x",
          };
        })
      : [],
  };
}
module.exports = { normalizeDelegation };
