require("dotenv").config();
const { ethers } = require("ethers");
const {
  createDelegation,
  getSmartAccountsEnvironment,
  ScopeType
} = require("@metamask/smart-accounts-kit");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const CHAIN_ID = 84532;

  const env = getSmartAccountsEnvironment(CHAIN_ID);

  const delegation = await createDelegation({
    from: wallet.address,
    to: "0xf1ef956eff4181Ce913b664713515996858B9Ca9",
    environment: env,

    scope: {
      type: ScopeType.FunctionCall,
      targets: ["0x0000000000000000000000000000000000000000"],
      selectors: ["0x00000000"]
    },

    salt: ethers.hexlify(ethers.randomBytes(32)),
    validUntil: Math.floor(Date.now() / 1000) + 3600
  });

  console.log("\nRAW DELEGATION:");
  console.log(JSON.stringify(delegation, null, 2));

  // 🔥 THIS is the missing step in YOUR setup
  console.log("\nCHECKING KIT OUTPUT FIELDS:");

  console.log("domain:", delegation.domain);
  console.log("types:", delegation.types);
  console.log("message:", delegation.message);
}

main().catch(console.error);
