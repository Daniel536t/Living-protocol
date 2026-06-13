require("dotenv").config();
const { ethers } = require("ethers");
const { createSmartKit } = require("./smartkit-x/src/index");

const CHAIN_ID = 11155111;
const RELAYER_TARGET = "0x02c9979a75fbdbc3a77485024ab8b6474308591e";
const VAULT = "0xdc8E2f6F6C630Bc6583f1d994dD7cD6e7E486062";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const FEE_COLLECTOR = "0xE936e8FAf4A5655469182A49a505055B71C17604";
const VAULT_ABI = ["function storePattern(string,string,string,string,string[],string[])"];

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const vaultIface = new ethers.Interface(VAULT_ABI);
  const usdcIface = new ethers.Interface(["function transfer(address,uint256)"]);

  const PATTERN_ID = "proof-" + Date.now();
  console.log("═══════════════════════════════════════════");
  console.log("  ON-CHAIN PROOF — GASLESS RELAY");
  console.log("═══════════════════════════════════════════\n");
  console.log("Pattern:", PATTERN_ID);
  console.log("Vault:", VAULT);
  console.log("Relayer delegate:", RELAYER_TARGET);
  console.log("");

  const storeData = vaultIface.encodeFunctionData("storePattern", [
    PATTERN_ID, "PROOF", "1Shot gasless relay proof",
    "contract Proof{}", ["proof"], ["getProof"],
  ]);
  const feeData = usdcIface.encodeFunctionData("transfer", [FEE_COLLECTOR, ethers.parseUnits("0.01", 6)]);

  // Count before
  const vault = new ethers.Contract(VAULT, ["function patternCount() view returns (uint256)"], provider);
  const before = await vault.patternCount();
  console.log("Vault count before:", before.toString());

  const kit = createSmartKit({ provider, relayerTarget: RELAYER_TARGET });
  const result = await kit.client.execute({
    wallet, chainId: CHAIN_ID, contract: VAULT,
    targets: [USDC, VAULT],
    selectors: ["0xa9059cbb", vaultIface.getFunction("storePattern").format("sighash")],
    calls: [
      { to: USDC, data: feeData, value: "0" },
      { to: VAULT, data: storeData, value: "0" },
    ],
  });

  console.log("Relayer response:", JSON.stringify(result));

  // Count after
  await new Promise(r => setTimeout(r, 5000)); // Wait for confirmation
  const after = await vault.patternCount();
  console.log("Vault count after:", after.toString());

  if (Number(after) > Number(before)) {
    console.log("\n✅ PROOF CONFIRMED!");
    console.log("   Pattern count increased from", before.toString(), "to", after.toString());
    console.log("   Pattern ID:", PATTERN_ID);
    console.log("   Verify: https://sepolia.etherscan.io/address/" + VAULT + "#readContract");
    console.log("   Call patternCount() — you will see", after.toString());
  } else {
    console.log("\n⏳ Transaction may still be pending. Check vault shortly.");
  }
}

main().catch(e => console.error("FATAL:", e.message));
