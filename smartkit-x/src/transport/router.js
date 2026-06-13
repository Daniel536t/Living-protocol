const { send7710 } = require("../relayer/send");
const { simulateRelayer } = require("../simulate/simulateRelayer");

async function route({ chainId, executions, permissionContext, authorizationList }) {
  const url = "https://relayer.1shotapi.dev/relayers";

  // WINNING FORMAT from earlier testing:
  // params as OBJECT, chainId as NUMBER, transactions with permissionContext per-tx
  const payload = {
    jsonrpc: "2.0", id: Date.now(),
    method: "relayer_send7710Transaction",
    params: {
      chainId: Number(chainId),
      transactions: [{
        executions: executions,
        permissionContext: permissionContext,
      }],
    },
  };

  const sim = await simulateRelayer(payload);
  if (!sim.valid) throw new Error("[SimRelayer] Blocked request: " + JSON.stringify(sim.issues));

  return send7710(url, payload);
}
module.exports = { route };
