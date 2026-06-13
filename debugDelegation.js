const { ethers } = require("ethers");
const {
  createDelegation,
  getSmartAccountsEnvironment,
  ScopeType
} = require("@metamask/smart-accounts-kit");

function deepInspect(obj, label) {
  console.log(`\n🔍 ==== ${label} ====`);
  console.log(JSON.stringify(obj, (k, v) => {
    if (typeof v === "bigint") return v.toString();
    return v;
  }, 2));
}

function findNulls(obj, path = "") {
  const issues = [];

  for (const key in obj) {
    const value = obj[key];
    const currentPath = path ? `${path}.${key}` : key;

    if (value === null || value === undefined) {
      issues.push(currentPath);
    } else if (typeof value === "object") {
      issues.push(...findNulls(value, currentPath));
    }
  }

  return issues;
}

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
    validUntil: Math.floor(Date.now() / 1000) + 3600,
  });

  // 1. raw inspection
  deepInspect(delegation, "RAW DELEGATION OBJECT");

  // 2. null/undefined scan
  const nullFields = findNulls(delegation);
  console.log("\n🚨 NULL / UNDEFINED FIELDS:");
  console.log(nullFields.length ? nullFields : "NONE");

  // 3. domain/types/message breakdown
  console.log("\n📦 DOMAIN:");
  console.log(JSON.stringify(delegation.domain, null, 2));

  console.log("\n📦 TYPES:");
  console.log(JSON.stringify(delegation.types, null, 2));

  console.log("\n📦 MESSAGE:");
  console.log(JSON.stringify(delegation.message, null, 2));

  // 4. sanity check for signing readiness
  const ready =
    delegation?.domain &&
    delegation?.types &&
    delegation?.message;

  console.log("\n🧠 SIGNING READY:", ready);

  // 5. hash simulation (what relayer expects internally)
  try {
    const hash = ethers.TypedDataEncoder.hash(
      delegation.domain,
      delegation.types,
      delegation.message
    );

    console.log("\n🔐 SIMULATED EIP-712 HASH:");
    console.log(hash);
  } catch (e) {
    console.log("\n❌ HASH COMPUTATION FAILED:");
    console.log(e.message);
  }
}

main().catch(console.error);
