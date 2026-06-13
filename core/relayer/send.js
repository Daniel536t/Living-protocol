const axios = require("axios");

function normalizePayload({ chainId, execution, permissionContext }) {
  return {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "relayer_send7710Transaction",
    params: {
      chainId,
      transactions: [{ executions: [execution], permissionContext }],
    },
  };
}

async function sendRelayer(url, payload) {
  try {
    const res = await axios.post(url, payload);
    if (res.data && res.data.error) {
      console.error("Relayer rejected:");
      console.error(JSON.stringify(res.data, null, 2));
      return res.data;
    }
    console.log("Relayer accepted");
    return res.data;
  } catch (e) {
    console.error("Network error:", e.response ? e.response.data : e.message);
    return { error: e.message };
  }
}

module.exports = { normalizePayload, sendRelayer };
