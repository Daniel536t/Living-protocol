const CHAINS = {
  8453: { name: "Base", relayerSupported: true, delegationManager: "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3" },
  84532: { name: "Base Sepolia", relayerSupported: true, delegationManager: "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3" },
  11155111: { name: "Sepolia", relayerSupported: true, delegationManager: "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3" },
};

function assertChain(chainId) {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error("[SmartKit] Unsupported chain: " + chainId);
  if (!chain.relayerSupported) throw new Error("[SmartKit] Relayer does not support chain: " + chainId + " (" + chain.name + ")");
  return chain;
}

module.exports = { CHAINS, assertChain };
