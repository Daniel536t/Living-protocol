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
  console.log("  SmartKit-X: With Fee Payment");
  console.log("═══════════════════════════════════════════\n");

  const storeData = vaultIface.encodeFunctionData("storePattern", [
    "p-"+Date.now(), "Gasless Win", "1Shot Sepolia",
    "contract T{}", ["win"], ["getV"],
  ]);
  const feeData = usdcIface.encodeFunctionData("transfer", [FEE_COLLECTOR, ethers.parseUnits("0.01", 6)]);

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

  console.log("✅ SUCCESS:", JSON.stringify(result, null, 2));
}

main().catch(e => console.error("FATAL:", e.message));
