require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const fs = require("fs");

// ──── Configuration ────
const RELAYER_URL = "https://relayer.1shotapi.dev/relayers";
const CHAIN_ID = "11155111"; // Sepolia
const VAULT_ADDRESS = fs.readFileSync(".vault-address", "utf8").trim();

// These come from relayer_getCapabilities
let capabilities = null;

// ──── Relayer Client ────
class RelayerClient {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
  }

  // Step 1: Fetch capabilities (delegate address, tokens, fee collector)
  async fetchCapabilities() {
    if (capabilities) return capabilities;

    const response = await axios.post(RELAYER_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "relayer_getCapabilities",
      params: [CHAIN_ID],
    });

    capabilities = response.data.result[CHAIN_ID];
    console.log("✅ Relayer capabilities loaded:");
    console.log(`   Delegate: ${capabilities.targetAddress}`);
    console.log(`   Fee Collector: ${capabilities.feeCollector}`);
    console.log(`   Tokens: ${capabilities.tokens.map(t => t.symbol).join(", ")}`);
    return capabilities;
  }

  // Step 2: Get fee quote
  async getFeeQuote(paymentToken) {
    const response = await axios.post(RELAYER_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "relayer_getFeeData",
      params: {
        chainId: CHAIN_ID,
        token: paymentToken,
      },
    });

    const feeData = response.data.result;
    console.log(`💰 Fee quote: ${feeData.minFee} USDC (min)`);
    console.log(`   Gas price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`);
    console.log(`   Expires: ${new Date(feeData.expiry * 1000).toLocaleTimeString()}`);
    return feeData;
  }

  // Step 3: Estimate transaction with signed bundle
  async estimateTransaction(transactionParams) {
    const response = await axios.post(RELAYER_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "relayer_estimate7710Transaction",
      params: transactionParams,
    });

    const estimate = response.data.result;
    if (!estimate.success) {
      console.error("❌ Estimation failed:", estimate.error);
      return null;
    }

    console.log(`📊 Estimated fee: ${ethers.formatUnits(estimate.requiredPaymentAmount, 6)} USDC`);
    console.log(`   Gas used: ${estimate.gasUsed[CHAIN_ID]}`);
    return estimate;
  }

  // Step 4: Send transaction
  async sendTransaction(transactionParams) {
    const response = await axios.post(RELAYER_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "relayer_send7710Transaction",
      params: transactionParams,
    });

    const result = response.data.result;
    console.log(`📤 Transaction submitted: ${result.taskId}`);
    return result;
  }

  // Step 5: Track status
  async getStatus(taskId) {
    const response = await axios.post(RELAYER_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "relayer_getStatus",
      params: [taskId],
    });

    return response.data.result;
  }

  // Step 6: Wait for confirmation
  async waitForConfirmation(taskId, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getStatus(taskId);
      console.log(`   Status [${i + 1}/${maxAttempts}]: ${status.status}`);

      if (["Confirmed", "Rejected", "Reverted"].includes(status.status)) {
        if (status.status === "Confirmed") {
          console.log(`✅ Transaction confirmed!`);
          if (status.txHash) console.log(`   Tx: ${status.txHash}`);
        } else {
          console.error(`❌ Transaction ${status.status}:`, status.error || "");
        }
        return status;
      }

      await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
    }
    throw new Error("Timeout waiting for confirmation");
  }

  // ──── Vault-Specific Methods ────

  // Build a vault storePattern call
  buildVaultStorePattern(patternId, name, description, codeTemplate, tags, features) {
    const vaultInterface = new ethers.Interface([
      "function storePattern(string,string,string,string,string[],string[])",
    ]);

    return vaultInterface.encodeFunctionData("storePattern", [
      patternId,
      name,
      description,
      codeTemplate,
      tags,
      features,
    ]);
  }

  // Build a vault recordSuccess call
  buildVaultRecordSuccess(patternId) {
    const vaultInterface = new ethers.Interface([
      "function recordSuccess(string)",
    ]);
    return vaultInterface.encodeFunctionData("recordSuccess", [patternId]);
  }

  // Build a vault delegateAccess call (for redelegation)
  buildVaultDelegateAccess(patternId, toAgent) {
    const vaultInterface = new ethers.Interface([
      "function delegateAccess(string,address)",
    ]);
    return vaultInterface.encodeFunctionData("delegateAccess", [patternId, toAgent]);
  }
}

module.exports = RelayerClient;
