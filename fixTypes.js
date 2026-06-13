module.exports = {
  Delegation: [
    { name: "delegate", type: "address" },
    { name: "delegator", type: "address" },
    { name: "authority", type: "bytes32" },

    {
      name: "caveats",
      type: "tuple[]",
      components: [
        { name: "enforcer", type: "address" },
        { name: "terms", type: "bytes32" },
        { name: "args", type: "bytes" }
      ]
    },

    { name: "salt", type: "bytes32" }
  ]
};
