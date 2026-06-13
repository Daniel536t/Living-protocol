require("dotenv").config();
const { ethers } = require("ethers");
const { createSmartKit } = require("./smartkit-x/src/index");

const RELAYER_URL = "https://relayer.1shotapi.com/relayers";
const CHAIN_ID = 84532;  // Base Sepolia
const RELAYER_TARGET = "0xf1ef956eff4181Ce913b664713515996858B9Ca9";
const VAULT = "0xA9785f5770AA01184a41f422220d0e05175B622d";  // Base Sepolia vault
const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const FEE_COLLECTOR = "0xE936e8FAf4A5655469182A49a505055B71C17604";
const VAULT_ABI = ["function storePattern(string,string,string,string,string[],string[])"];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const vaultIface = new ethers.Interface(VAULT_ABI);
  const usdcIface = new ethers.Interface(["function transfer(address,uint256)"]);

  console.log("═══════════════════════════════════════════");
  console.log("  1Shot GASLESS — Base Sepolia");
  console.log("═══════════════════════════════════════════\n");
  console.log("Chain: Base Sepolia (84532)");
  console.log("Target:", RELAYER_TARGET);
  console.log("Vault:", VAULT);
  console.log("USDC:", USDC, "\n");

  // Check balances
  const ethBal = await provider.getBalance(wallet.address);
  const usdc = new ethers.Contract(USDC, ["function balanceOf(address) view returns (uint256)"], provider);
  const usdcBal = await usdc.balanceOf(wallet.address);
  console.log("ETH:", ethers.formatEther(ethBal));
  console.log("USDC:", ethers.formatUnits(usdcBal, 6), "\n");

  const PATTERN_ID = "gasless-" + Date.now();
  const storeData = vaultIface.encodeFunctionData("storePattern", [
    PATTERN_ID, "1Shot Gasless", "Base Sepolia Relay",
    "contract G {}", ["gasless", "base"], ["getG"],
  ]);
  const feeData = usdcIface.encodeFunctionData("transfer", [FEE_COLLECTOR, ethers.parseUnits("0.01", 6)]);

  console.log("→ Submitting to 1Shot relayer...");

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

  console.log("\n📡 Relayer Response:", JSON.stringify(result, null, 2));

  // Wait and verify
  console.log("\n→ Waiting for on-chain confirmation...");
  await new Promise(r => setTimeout(r, 10000));

  const vault = new ethers.Contract(VAULT, ["function patternCount() view returns (uint256)"], provider);
  const count = await vault.patternCount();
  console.log("Vault patterns:", count.toString());

  // Try to find our pattern
  const vault2 = new ethers.Contract(VAULT, [
    "function getPattern(string) view returns (string,string,string,string[],string[],uint256,address)",
  ], provider);
  try {
    const p = await vault2.getPattern(PATTERN_ID);
    console.log("✅ GASLESS PATTERN FOUND ON-CHAIN!");
    console.log("   Name:", p[0]);
    console.log("   Creator:", p[6]);
  } catch(e) {
    console.log("⏳ Pattern may still be confirming...");
  }
}

main().catch(e => console.error("FATAL:", e.message));
