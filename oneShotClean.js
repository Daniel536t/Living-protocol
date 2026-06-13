require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const fs = require("fs");

const RELAYER_URL = "https://relayer.1shotapi.dev/relayers";
const CHAIN_ID = 84532;

const VAULT_ADDRESS = fs.readFileSync(".vault-address-base", "utf8").trim();
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const RELAYER_DELEGATE = "0xf1ef956eff4181Ce913b664713515996858B9Ca9";
const FEE_COLLECTOR = "0xE936e8FAf4A5655469182A49a505055B71C17604";

const VAULT_ABI = [
  "function storePattern(string,string,string,string,string[],string[])"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("════════════════════════════════════");
  console.log("  1SHOT CLEAN PIPELINE (NO KIT)");
  console.log("════════════════════════════════════\n");

  // 1. Fee
  const feeResp = await axios.post(RELAYER_URL, {
    jsonrpc: "2.0",
    id: 1,
    method: "relayer_getFeeData",
    params: {
      chainId: String(CHAIN_ID),
      token: USDC_ADDRESS
    }
  });

  const feeData = feeResp.data.result;
  console.log("Fee:", feeData.minFee);

  // 2. Encode vault call ONLY (we keep execution explicit)
  const vaultIface = new ethers.Interface(VAULT_ABI);

  const callData = vaultIface.encodeFunctionData("storePattern", [
    "pattern-" + Date.now(),
    "Gasless",
    "1Shot Clean",
    "contract T { uint v; }",
    ["gasless"],
    ["getV"]
  ]);

  // 3. Build RAW delegation (minimal, deterministic)
  const salt = ethers.hexlify(ethers.randomBytes(32));

  const delegation = {
    delegate: RELAYER_DELEGATE,
    delegator: wallet.address,
    authority:
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    caveats: [],
    salt
  };

  // 4. REAL EIP-712 DOMAIN (manual, REQUIRED)
  const domain = {
    name: "DelegationManager",
    version: "1",
    chainId: CHAIN_ID,
    verifyingContract: RELAYER_DELEGATE
  };

  const types = {
    Delegation: [
      { name: "delegate", type: "address" },
      { name: "delegator", type: "address" },
      { name: "authority", type: "bytes32" },
      { name: "caveats", type: "tuple[]" },
      { name: "salt", type: "bytes32" }
    ]
  };

  const message = {
    delegate: delegation.delegate,
    delegator: delegation.delegator,
    authority: delegation.authority,
    caveats: delegation.caveats,
    salt: delegation.salt
  };

  // 5. SIGN
  const signature = await wallet.signTypedData(domain, types, message);

  console.log("Signed delegation ✔");

  // 6. RELAYER PAYLOAD (STRICT SHAPE)
  const payload = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "relayer_send7710Transaction",
    params: {
      chainId: CHAIN_ID,
      transactions: [
        {
          to: VAULT_ADDRESS,
          data: callData,
          value: "0x0",
          permissionContext: [
            {
              delegation,
              signature
            }
          ]
        }
      ]
    }
  };

  console.log("Submitting...\n");

  const resp = await axios.post(RELAYER_URL, payload);

  console.log(JSON.stringify(resp.data, null, 2));
}

main().catch((e) => {
  console.error(e.response?.data || e.message);
});
