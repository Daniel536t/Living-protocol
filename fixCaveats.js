const { ethers } = require("ethers");

function normalizeDelegation(delegation) {
  return {
    ...delegation,
    caveats: (delegation.caveats || []).map(c => ({
      enforcer: c.enforcer,
      terms: c.terms,
      args: c.args
    }))
  };
}

module.exports = { normalizeDelegation };
