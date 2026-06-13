function buildRelayerPayload({ chainId, execution, permissionContext }) {
  return {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "relayer_send7710Transaction",
    params: {
      chainId,
      transactions: [{
        executions: [execution],
        permissionContext: permissionContext.map(function(pc) {
          return {
            delegator: pc.delegator,
            delegate: pc.delegate,
            caveats: pc.caveats,
            salt: pc.salt,
            signature: pc.signature,
          };
        }),
      }],
    },
  };
}
module.exports = { buildRelayerPayload };
