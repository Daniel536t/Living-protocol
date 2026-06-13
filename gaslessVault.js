require("dotenv").config();
const { ethers } = require("ethers");
const RelayerClient = require("./relayerClient");

// ──── Configuration ────
const VAULT_ADDRESS = require("fs").readFileSync(".vault-address", "utf8").trim();
const CHAIN_ID = "11155111";

// USDC on Sepolia
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// ──── Gasless Vault Writer ────
class GaslessVaultWriter {
  constructor() {
    this.relayer = new RelayerClient();
    this.provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
  }

  async initialize() {
    this.capabilities = await this.relayer.fetchCapabilities();
    this.delegateAddress = this.capabilities.targetAddress;
    this.feeCollector = this.capabilities.feeCollector;
    console.log(`\n🔑 Using wallet: ${this.wallet.address}`);
    console.log(`📦 Vault: ${VAULT_ADDRESS}`);
    console.log(`🤝 Delegate: ${this.delegateAddress}\n`);
  }

  // Check USDC balance and allowance
  async checkUSDCStatus(requiredAmount) {
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, this.wallet);
    const balance = await usdc.balanceOf(this.wallet.address);
    const allowance = await usdc.allowance(this.wallet.address, this.feeCollector);

    console.log(`💵 USDC Balance: ${ethers.formatUnits(balance, 6)} USDC`);
    console.log(`🔓 Allowance to fee collector: ${ethers.formatUnits(allowance, 6)} USDC`);

    if (balance < requiredAmount) {
      throw new Error(`Insufficient USDC. Need ${ethers.formatUnits(requiredAmount, 6)}, have ${ethers.formatUnits(balance, 6)}`);
    }

    return { balance, allowance };
  }

  // Approve USDC spending by fee collector
  async approveUSDC(amount) {
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, this.wallet);
    console.log(`✅ Approving ${ethers.formatUnits(amount, 6)} USDC for fee collector...`);
    const tx = await usdc.approve(this.feeCollector, amount);
    await tx.wait();
    console.log(`   Approval tx: ${tx.hash}`);
  }

  // Store a pattern in the vault gaslessly
  async storePatternGasless(patternId, name, description, codeTemplate, tags, features) {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`  Storing pattern: ${name}`);
    console.log(`  ID: ${patternId}`);
    console.log(`  Tags: ${tags.join(", ")}`);
    console.log(`═══════════════════════════════════════\n`);

    // 1. Get fee quote
    console.log("→ Getting fee quote...");
    const feeData = await this.relayer.getFeeQuote(USDC_ADDRESS);
    const feeAmount = feeData.minFee; // Already in USDC units (e.g., "0.01")

    // 2. Check USDC balance
    await this.checkUSDCStatus(feeAmount);

    // 3. Encode the vault call
    const vaultCallData = this.relayer.buildVaultStorePattern(
      patternId, name, description, codeTemplate, tags, features
    );

    // 4. Build the execution bundle
    // This is a simplified version — full EIP-7710 requires proper delegation signing
    // For the demo, we structure the bundle as the relayer expects
    const executionBundle = {
      chainId: CHAIN_ID,
      // Fee payment transaction
      feeExecution: {
        to: USDC_ADDRESS,
        data: new ethers.Interface(USDC_ABI).encodeFunctionData("transfer", [
          this.feeCollector,
          feeAmount,
        ]),
        value: "0x0",
      },
      // Work transaction (vault write)
      workExecution: {
        to: VAULT_ADDRESS,
        data: vaultCallData,
        value: "0x0",
      },
    };

    console.log("→ Execution bundle built:");
    console.log(`   Fee: ${feeAmount} USDC → ${this.feeCollector}`);
    console.log(`   Work: storePattern → ${VAULT_ADDRESS}`);

    // 5. For demo purposes, we simulate the submission
    console.log("\n📋 Ready for relayer submission.");
    console.log("   In production, this would call relayer_send7710Transaction");
    console.log("   with a properly signed EIP-7702 delegation.\n");

    // Return the bundle for demo/display
    return {
      patternId,
      feeAmount: feeAmount.toString(),
      feeToken: "USDC",
      vaultAddress: VAULT_ADDRESS,
      workCallData: vaultCallData,
      executionBundle,
    };
  }

  // Record a successful pattern use (increments successCount)
  async recordSuccessGasless(patternId) {
    console.log(`\n📈 Recording success for pattern: ${patternId}`);

    const feeData = await this.relayer.getFeeQuote(USDC_ADDRESS);
    const feeAmount = BigInt(feeData.minFee);

    const vaultCallData = this.relayer.buildVaultRecordSuccess(patternId);

    return {
      patternId,
      feeAmount: feeAmount.toString(),
      vaultAddress: VAULT_ADDRESS,
      workCallData: vaultCallData,
    };
  }

  // Delegate pattern access to another agent (redelegation)
  async delegateAccessGasless(patternId, toAgent) {
    console.log(`\n🔗 Delegating access to pattern ${patternId}`);
    console.log(`   From: ${this.wallet.address}`);
    console.log(`   To: ${toAgent}`);

    const feeData = await this.relayer.getFeeQuote(USDC_ADDRESS);
    const feeAmount = BigInt(feeData.minFee);

    const vaultCallData = this.relayer.buildVaultDelegateAccess(patternId, toAgent);

    return {
      patternId,
      fromAgent: this.wallet.address,
      toAgent,
      feeAmount: feeAmount.toString(),
      vaultAddress: VAULT_ADDRESS,
      workCallData: vaultCallData,
    };
  }
}

// ──── Self-Test ────
(async () => {
  console.log("═══════════════════════════════════════════");
  console.log("  Gasless Vault Writer — 1Shot Integration");
  console.log("═══════════════════════════════════════════\n");

  const writer = new GaslessVaultWriter();
  await writer.initialize();

  // Test: Store a new pattern
  const result = await writer.storePatternGasless(
    "test-pattern-001",
    "Test Loyalty Program",
    "A loyalty program with points and NFT rewards",
    "contract TestLoyalty { /* ... */ }",
    ["loyalty", "points", "nft", "rewards"],
    ["earnPoints", "redeemPoints", "mintNFT"]
  );

  console.log("✅ Gasless vault integration ready!");
  console.log("\nNext steps for full integration:");
  console.log("1. Implement EIP-7702 authorization signing");
  console.log("2. Add delegation signature generation");
  console.log("3. Submit via relayer_send7710Transaction");
  console.log("4. Track via webhook or polling");
})();
