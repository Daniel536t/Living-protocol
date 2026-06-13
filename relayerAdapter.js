const axios = require("axios");

function assert(obj, msg) {
  if (obj === undefined || obj === null) throw new Error(`[RelayerAdapter] ${msg} is null/undefined`);
}

function buildRelayerPayload({ chainId, vaultAddress, callData, delegation, signature }) {
  assert(vaultAddress, "vaultAddress");
  assert(callData, "callData");
  assert(delegation, "delegation");
  assert(signature, "signature");

  return {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "relayer_send7710Transaction",
    params: {
      chainId,
      transactions: [{
        executions: [{ callType: "call", target: vaultAddress, callData, value: "0x0" }],
        permissionContext: [{
          delegator: delegation.delegator,
          delegate: delegation.delegate,
          caveats: delegation.caveats || [],
          salt: delegation.salt,
          signature,
        }],
      }],
    },
  };
}

async function sendRelayer(url, payload) {
  try { const res = await axios.post(url, payload); return res.data; }
  catch (e) { return e.response?.data || { error: e.message }; }
}

module.exports = { buildRelayerPayload, sendRelayer };
