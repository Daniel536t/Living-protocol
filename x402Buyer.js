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

  console.log("═══════════════════════════════════════════");
  console.log("  x402 + ERC-7710: REAL Payment Test");
  console.log("═══════════════════════════════════════════\n");

  // Step 1: Call the x402 seller → get 402
  console.log("→ Contacting x402 seller...");
  const resp = await fetch("http://localhost:8080/x402/protected");
  if (resp.status !== 402) {
    console.log("Already verified or endpoint error. Status:", resp.status);
    return;
  }
  const amt = resp.headers.get("X-Payment-Amount");
  console.log("✓ 402 Received: Pay " + (Number(amt)/1000000).toFixed(2) + " USDC\n");

  // Step 2: Build the dual execution (USDC payment + vault store)
  const PATTERN_ID = "x402-" + Date.now();
  const feeAmount = ethers.parseUnits("0.01", 6);
  const feeCalldata = usdcIface.encodeFunctionData("transfer", [FEE_COLLECTOR, feeAmount]);
  const storeCalldata = vaultIface.encodeFunctionData("storePattern", [
    PATTERN_ID, "x402 Paid Pattern", "Purchased via x402 + ERC-7710 + 1Shot",
    "contract x402{}", ["x402", "paid"], ["getX402"],
  ]);

  console.log("→ Creating ERC-7710 delegation...");

  // Step 3: Use SmartKit-X to execute (delegation + sign + relayer)
  const kit = createSmartKit({ provider, relayerTarget: RELAYER_TARGET });

  // Count before
  const vault = new ethers.Contract(VAULT, ["function patternCount() view returns (uint256)"], provider);
  const before = Number(await vault.patternCount());
  console.log("Vault count before:", before);

  const result = await kit.client.execute({
    wallet, chainId: CHAIN_ID, contract: VAULT,
    targets: [USDC, VAULT],
    selectors: ["0xa9059cbb", vaultIface.getFunction("storePattern").format("sighash")],
    calls: [
      { to: USDC, data: feeCalldata, value: "0" },
      { to: VAULT, data: storeCalldata, value: "0" },
    ],
  });

  console.log("\n📡 1Shot Relayer Response:", JSON.stringify(result, null, 2));

  // Wait and verify
  console.log("\n→ Waiting for on-chain confirmation...");
  await new Promise(r => setTimeout(r, 8000));

  const after = Number(await vault.patternCount());
  console.log("Vault count after:", after);

  if (after > before) {
    console.log("\n🎉 x402 PAYMENT VERIFIED ON-CHAIN!");
    console.log("   Pattern stored:", PATTERN_ID);
    console.log("   Vault: https://sepolia.etherscan.io/address/" + VAULT);
    console.log("   Count increased from", before, "to", after);

    // Step 4: Verify with seller
    const verifyResp = await fetch("http://localhost:8080/x402/protected", {
      headers: { "x-payment-status": "verified" }
    });
    const verifyData = await verifyResp.json();
    console.log("   Seller verification:", verifyData.success ? "✅ GRANTED" : "❌ DENIED");
  } else {
    console.log("⏳ Transaction may still be pending. Check vault shortly.");
  }
}

main().catch(e => console.error("FATAL:", e.message));
