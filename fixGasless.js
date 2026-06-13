const fs = require("fs");
let gv = fs.readFileSync("gaslessVault.js", "utf8");

// Use the decimal directly instead of converting from BigInt
gv = gv.replace(
  `const feeAmount = BigInt(feeData.minFee);`,
  `const feeAmount = feeData.minFee; // Already in USDC units (e.g., "0.01")`
);

gv = gv.replace(
  `console.log(\`   Fee: \${ethers.formatUnits(feeAmount, 6)} USDC → \${this.feeCollector}\`);`,
  `console.log(\`   Fee: \${feeAmount} USDC → \${this.feeCollector}\`);`
);

fs.writeFileSync("gaslessVault.js", gv);
console.log("✅ Fixed");
