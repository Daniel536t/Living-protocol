require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const fs = require("fs");
const {
  createDelegation,
  getSmartAccountsEnvironment,
  ScopeType
} = require("@metamask/smart-accounts-kit");

const RELAYER_URL = "https://relayer.1shotapi.dev/relayers";
const CHAIN_ID = 84532;

const VAULT_ADDRESS = fs.readFileSync(".vault-address-base", "utf8").trim();
const RELAYER_DELEGATE = "0xf1ef956eff4181Ce913b664713515996858B9Ca9";

const VAULT_ABI = [
  "function storePattern(string,string,string,string,string[],string[])"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("═══════════════════════════════");
  console.log("  FINAL 1SHOT WORKING PIPELINE");
  console.log("═══════════════════════════════\n");

  const feeResp = await axios.post(RELAYER_URL, {
    jsonrpc: "2.0",
    id: 1,
    method: "relayer_getFeeData",
    params: {
      chainId: String(CHAIN_ID),
      token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    }
  });

  const feeData = feeResp.data.result;
  console.log("Fee:", feeData.minFee);

  const vaultIface = new ethers.Interface(VAULT_ABI);

  const callData = vaultIface.encodeFunctionData("storePattern", [
    "pattern-" + Date.now(),
    "Gasless",
    "1Shot Final",
    "contract T { uint v; }",
    ["gasless"],
    ["getV"]
  ]);

  // STEP 1 — KIT ONLY FOR STRUCT
  const env = getSmartAccountsEnvironment(CHAIN_ID);

  const delegation = await createDelegation({
    from: wallet.address,
    to: RELAYER_DELEGATE,
    environment: env,

    scope: {
      type: ScopeType.FunctionCall,
      targets: [VAULT_ADDRESS],
      selectors: [
        vaultIface.getFunction("storePattern").format("sighash")
      ]
    },

    salt: ethers.hexlify(ethers.randomBytes(32)),
    validUntil: Math.floor(Date.now() / 1000) + 3600
  });

  // STEP 2 — MANUAL EIP-712 (RELIABLE LAYER)
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
      { name: "caveats", type: "bytes[]" },
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

  const signature = await wallet.signTypedData(domain, types, message);

  console.log("Signed ✔");

  // STEP 3 — RELAYER CALL
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

main().catch(console.error);
