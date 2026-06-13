module.exports = function buildPayload(CHAIN_ID, VAULT_ADDRESS, callData, delegation, signature) {
  return {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "relayer_send7710Transaction",
    params: {
      chainId: CHAIN_ID,
      transactions: [
        {
          to: VAULT_ADDRESS,
          data: callData,
          value: "0x0",
          permissionContext: [
            {
              delegation,
              signature,
            },
          ],
        },
      ],
    },
  };
};
