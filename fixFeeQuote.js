const fs = require("fs");
let client = fs.readFileSync("relayerClient.js", "utf8");

// Fix: display minFee directly as it's already in token units, not raw
client = client.replace(
  `console.log(\`💰 Fee quote: \${ethers.formatUnits(feeData.minFee, 6)} USDC (min)\`);`,
  `console.log(\`💰 Fee quote: \${feeData.minFee} USDC (min)\`);`
);

fs.writeFileSync("relayerClient.js", client);
console.log("✅ Fixed");
