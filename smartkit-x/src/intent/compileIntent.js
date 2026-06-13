function compileIntent(intent, context) {
  if (intent.type === "STORE_DATA") {
    return {
      calls: [{ to: context.vault, data: context.vaultIface.encodeFunctionData("storePattern", intent.payload) }],
      targets: [context.vault],
      selectors: [context.selector],
    };
  }
  if (intent.type === "TOKEN_TRANSFER") {
    return {
      calls: [{ to: intent.token, data: context.erc20Iface.encodeFunctionData("transfer", [intent.to, intent.amount]) }],
      targets: [intent.token],
      selectors: ["0xa9059cbb"],
    };
  }
  throw new Error("[Intent] Unknown intent type: " + intent.type);
}
module.exports = { compileIntent };
