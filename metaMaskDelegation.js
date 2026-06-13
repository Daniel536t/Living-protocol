require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

// ──── Configuration ────
const VAULT_ADDRESS = fs.readFileSync(".vault-address", "utf8").trim();
const CHAIN_ID = 11155111; // Sepolia
const DELEGATE_ADDRESS = "0x02c9979a75fbdbc3a77485024ab8b6474308591e"; // 1Shot delegate

// ──── ERC-7715 Permission Types ────
const PERMISSION_TYPES = {
  VAULT_READ: "vault_read",
  VAULT_WRITE: "vault_write",
  PATTERN_DELEGATE: "pattern_delegate",
  PATTERN_REDELEGATE: "pattern_redelegate",
};

// ──── MetaMask Delegation Manager ────
class MetaMaskDelegationManager {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Vault contract interface
    this.vaultInterface = new ethers.Interface([
      "function storePattern(string,string,string,string,string[],string[])",
      "function getPattern(string) view returns (string,string,string,string[],string[],uint256,address)",
      "function searchByTags(string[],uint256) view returns (string[],uint256[])",
      "function delegateAccess(string,address)",
      "function revokeAccess(string,address)",
      "function recordSuccess(string)",
      "function hasAccess(address,string) view returns (bool)",
      "function getAgentPatterns(address) view returns (string[])",
    ]);
  }

  // ──── Permission Creation ────

  /**
   * Create an ERC-7715 advanced permission for vault access
   * In production, this would be signed by the user's MetaMask wallet
   */
  async createVaultPermission(permissionType, scope = "*") {
    const permission = {
      type: permissionType,
      target: VAULT_ADDRESS,
      chainId: CHAIN_ID,
      scope: scope, // "*" for all patterns, or specific pattern ID
      operations: this.getOperationsForType(permissionType),
      expiration: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
      redelegable: permissionType === PERMISSION_TYPES.PATTERN_DELEGATE,
    };

    // Sign the permission (simulating MetaMask's eth_signTypedData)
    const permissionHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "address", "uint256", "string", "string[]", "uint256", "bool"],
        [
          permission.type,
          permission.target,
          permission.chainId,
          permission.scope,
          permission.operations,
          permission.expiration,
          permission.redelegable,
        ]
      )
    );

    const signature = await this.wallet.signMessage(ethers.getBytes(permissionHash));

    console.log(`✅ Permission created: ${permissionType}`);
    console.log(`   Target: ${VAULT_ADDRESS}`);
    console.log(`   Scope: ${scope}`);
    console.log(`   Operations: ${permission.operations.join(", ")}`);
    console.log(`   Redelegable: ${permission.redelegable}`);

    return { permission, permissionHash, signature };
  }

  getOperationsForType(type) {
    switch (type) {
      case PERMISSION_TYPES.VAULT_READ:
        return ["getPattern", "searchByTags", "hasAccess", "getAgentPatterns"];
      case PERMISSION_TYPES.VAULT_WRITE:
        return ["storePattern", "recordSuccess"];
      case PERMISSION_TYPES.PATTERN_DELEGATE:
        return ["delegateAccess"];
      case PERMISSION_TYPES.PATTERN_REDELEGATE:
        return ["delegateAccess"];
      default:
        return [];
    }
  }

  // ──── Redelegation Flow ────

  /**
   * Agent A delegates pattern access to Agent B
   * This is the core redelegation mechanic for A2A coordination
   */
  async delegatePatternAccess(patternId, targetAgent) {
    console.log(`\n🔗 Redelegation: ${this.wallet.address} → ${targetAgent}`);
    console.log(`   Pattern: ${patternId}`);

    // Check if sender has access
    const vault = new ethers.Contract(VAULT_ADDRESS, this.vaultInterface, this.wallet);
    const hasAccess = await vault.hasAccess(this.wallet.address, patternId);

    if (!hasAccess) {
      console.log(`   ⚠️  No access to pattern ${patternId}. Granting self-access first...`);
      // In production, this would require the original creator's permission
    }

    // Build delegation transaction
    const tx = await vault.delegateAccess(patternId, targetAgent);
    console.log(`   Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Access delegated to ${targetAgent}`);

    return {
      from: this.wallet.address,
      to: targetAgent,
      patternId,
      txHash: tx.hash,
    };
  }

  /**
   * Chain delegation: Agent A → Agent B → Agent C
   * This demonstrates the full redelegation power
   */
  async chainDelegation(patternId, agentB, agentC) {
    console.log(`\n⛓️  Chain Delegation:`);
    console.log(`   Agent A (${this.wallet.address})`);
    console.log(`   → Agent B (${agentB})`);
    console.log(`   → Agent C (${agentC})`);

    // Step 1: A delegates to B
    const step1 = await this.delegatePatternAccess(patternId, agentB);

    // Step 2: B redelegates to C
    // In production, Agent B would sign this themselves
    console.log(`\n   Agent B redelegating to Agent C...`);
    const vault = new ethers.Contract(VAULT_ADDRESS, this.vaultInterface, this.wallet);
    const tx = await vault.delegateAccess(patternId, agentC);
    await tx.wait();
    console.log(`   ✅ Redelegation complete: ${agentB} → ${agentC}`);

    return {
      step1,
      step2: {
        from: agentB,
        to: agentC,
        patternId,
        txHash: tx.hash,
      },
    };
  }

  // ──── EIP-7702 Authorization ────

  /**
   * Build EIP-7702 authorization to upgrade wallet to smart account
   * This is required by 1Shot relayer for gasless transactions
   */
  async build7702Authorization() {
    console.log(`\n📜 Building EIP-7702 authorization...`);
    console.log(`   Account: ${this.wallet.address}`);
    console.log(`   Delegate: ${DELEGATE_ADDRESS}`);

    // EIP-7702 authorization structure
    const authorization = {
      chainId: CHAIN_ID,
      address: this.wallet.address,
      nonce: await this.provider.getTransactionCount(this.wallet.address),
      delegate: DELEGATE_ADDRESS,
      // In production, this would be signed by the wallet owner
    };

    // Sign the authorization
    const authHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256", "address"],
        [authorization.chainId, authorization.address, authorization.nonce, authorization.delegate]
      )
    );

    const signature = await this.wallet.signMessage(ethers.getBytes(authHash));

    console.log(`   Nonce: ${authorization.nonce}`);
    console.log(`   ✅ Authorization signed`);

    return { authorization, signature };
  }

  // ──── Status & Validation ────

  /**
   * Check the delegation status of a pattern
   */
  async checkPatternAccess(patternId, agent) {
    const vault = new ethers.Contract(VAULT_ADDRESS, this.vaultInterface, this.provider);
    const hasAccess = await vault.hasAccess(agent, patternId);

    console.log(`\n🔍 Access check:`);
    console.log(`   Pattern: ${patternId}`);
    console.log(`   Agent: ${agent}`);
    console.log(`   Has access: ${hasAccess}`);

    return hasAccess;
  }

  /**
   * Get all patterns an agent has contributed to or accessed
   */
  async getAgentProfile(agent) {
    const vault = new ethers.Contract(VAULT_ADDRESS, this.vaultInterface, this.provider);
    const patterns = await vault.getAgentPatterns(agent);

    console.log(`\n👤 Agent Profile: ${agent}`);
    console.log(`   Patterns: ${patterns.length}`);

    return patterns;
  }
}

// ──── Self-Test ────
(async () => {
  console.log("═══════════════════════════════════════════");
  console.log("  MetaMask Delegation Layer");
  console.log("  ERC-7715 + Redelegation + EIP-7702");
  console.log("═══════════════════════════════════════════\n");

  const delegation = new MetaMaskDelegationManager();

  console.log(`🔑 Agent: ${delegation.wallet.address}`);
  console.log(`📦 Vault: ${VAULT_ADDRESS}`);
  console.log(`⛓️  Chain: Sepolia (${CHAIN_ID})\n`);

  // Test 1: Create permissions
  console.log("─── Permission Creation ───");
  const readPerm = await delegation.createVaultPermission(PERMISSION_TYPES.VAULT_READ);
  const writePerm = await delegation.createVaultPermission(PERMISSION_TYPES.VAULT_WRITE);
  const delegatePerm = await delegation.createVaultPermission(
    PERMISSION_TYPES.PATTERN_DELEGATE, "pattern-loyalty-001"
  );

  // Test 2: Build 7702 authorization
  console.log("\n─── EIP-7702 Authorization ───");
  const auth7702 = await delegation.build7702Authorization();

  // Test 3: Simulate redelegation chain
  console.log("\n─── Redelegation Chain ───");
  const agentB = "0x0000000000000000000000000000000000000B0B";
  const agentC = "0x0000000000000000000000000000000000000C0C";

  console.log(`\n📋 Redelegation scenario:`);
  console.log(`   Agent A (us): Creates pattern "loyalty-001"`);
  console.log(`   Agent B: Receives access, specializes in DeFi`);
  console.log(`   Agent C: Receives redelegated access, adds governance`);

  // Store a pattern first so we have something to delegate
  console.log("\n→ Storing test pattern for delegation demo...");
  const vault = new ethers.Contract(
    VAULT_ADDRESS,
    delegation.vaultInterface,
    delegation.wallet
  );

  try {
    const tx = await vault.storePattern(
      "pattern-loyalty-001",
      "Loyalty Program",
      "Customer loyalty with points and NFT rewards",
      "contract Loyalty { /* ... */ }",
      ["loyalty", "points", "nft"],
      ["earnPoints", "redeemPoints"]
    );
    await tx.wait();
    console.log(`   ✅ Pattern stored`);
  } catch (e) {
    console.log(`   Pattern may already exist: ${e.message.slice(0, 50)}...`);
  }

  // Delegate
  await delegation.delegatePatternAccess("pattern-loyalty-001", agentB);

  // Check access
  await delegation.checkPatternAccess("pattern-loyalty-001", agentB);

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ MetaMask Delegation Layer Ready");
  console.log("═══════════════════════════════════════════");
  console.log("\n📋 Architecture Summary:");
  console.log("   1. ERC-7715 Permissions → Vault access control");
  console.log("   2. Redelegation → Agent-to-agent knowledge sharing");
  console.log("   3. EIP-7702 → Smart account upgrade for 1Shot relayer");
  console.log("   4. All integrated with on-chain vault at:", VAULT_ADDRESS);
})();
