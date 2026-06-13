const axios = require("axios");

async function safeSendRelayer(url, payload) {
  console.log("Sending to relayer...");
  try {
    var res = await axios.post(url, payload);
    if (res.data && res.data.error) {
      console.log("Relayer rejected:");
      console.log(JSON.stringify(res.data, null, 2));
      return res.data;
    }
    console.log("Relayer accepted");
    return res.data;
  } catch (err) {
    console.log("Network error:", err.response ? err.response.data : err.message);
    return { error: err.message };
  }
}

module.exports = { safeSendRelayer };
