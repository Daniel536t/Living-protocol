const { createSmartKit } = require("../index");

function createClient(config) {
  const kit = createSmartKit(config);
  return {
    execute: async function(input) {
      if (!input.wallet) throw new Error("[Client] wallet required");
      if (!input.chainId) throw new Error("[Client] chainId required");
      return kit.execute({
        wallet: input.wallet, chainId: input.chainId, contract: input.contract,
        calls: input.calls, targets: input.targets, selectors: input.selectors,
      });
    }
  };
}
module.exports = { createClient };
