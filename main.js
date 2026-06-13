require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { callAI } = require("./veniceAIService");
const { uploadToIPFS } = require("./ipfsStore");

const VAULT_ADDRESS = "0xA9785f5770AA01184a41f422220d0e05175B622d";
const CODE_STORE_DIR = path.join(__dirname, "codeStore");
if (!fs.existsSync(CODE_STORE_DIR)) fs.mkdirSync(CODE_STORE_DIR);

const VAULT_ABI = [
  "function storePattern(string,string,string,string,string[],string[])",
  "function getPattern(string) view returns (string,string,string,string[],string[],uint256,address)",
  "function getAgentPatterns(address) view returns (string[])",
  "function patternCount() view returns (uint256)",
];

const FALLBACK_TEMPLATES = {
  loyalty: { name: "Loyalty", tags: ["loyalty","points","rewards"], features: ["earn","redeem"], code: "contract Loyalty { mapping(address=>uint) public points; address owner; constructor(){owner=msg.sender;} function earn(address u,uint a) external { require(msg.sender==owner); points[u]+=a; } }" },
  nft: { name: "NFT", tags: ["nft","membership","mint"], features: ["mint"], code: "contract NFT { mapping(uint=>address) public owners; uint counter; address owner; constructor(){owner=msg.sender;} function mint(address t) external { require(msg.sender==owner); counter++; owners[counter]=t; } }" },
  staking: { name: "Staking", tags: ["staking","yield","rewards"], features: ["stake","claim"], code: "contract Staking { mapping(address=>uint) public staked; uint rate; address owner; constructor(uint r){owner=msg.sender;rate=r;} function stake() external payable { staked[msg.sender]+=msg.value; } }" },
  subscription: { name: "Subscription", tags: ["subscription","recurring"], features: ["subscribe"], code: "contract Sub { mapping(address=>uint) public expiry; uint fee; address owner; constructor(uint f){owner=msg.sender;fee=f;} function sub() external payable { require(msg.value>=fee); expiry[msg.sender]=block.timestamp+30 days; } }" },
};

class VaultClient {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org");
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, this.wallet);
  }

  async queryVault(words) {
    try {
      const ids = await this.vault.getAgentPatterns(this.wallet.address);
      if (!ids || ids.length === 0) return [];
      const results = [];
      for (const id of ids.slice(-10)) {
        try {
          const p = await this.vault.getPattern(id);
          const tags = p[3] || [];
          const score = words.filter(w => tags.some(t => t.toLowerCase().includes(w))).length;
          if (score > 0) results.push({ id, name: p[0], code: p[2], tags, features: p[4], score, source: 'vault' });
        } catch {}
      }
      return results.sort((a,b) => b.score - a.score).slice(0, 3);
    } catch(e) { return []; }
  }

  async storeHash(patternId, name, desc, codeHash, tags, features) {
    try {
      const tx = await this.vault.storePattern(patternId, name, desc, "sha256:"+codeHash, tags, features, { gasLimit: 800000 });
      await tx.wait();
      console.log(`💾 Stored: ${patternId} (tx: ${tx.hash})`);
      return { txHash: tx.hash };
    } catch(e) {
      console.log(`⚠️ Store failed: ${e.message.slice(0,60)}`);
      return { txHash: null };
    }
  }
}

async function processRequest(userInput) {
  const vault = new VaultClient();
  const pid = `pattern-${Date.now()}`;
  console.log(`\n🧠 "${userInput}"\n`);

  // Step 1: Intent
  const iResp = await callAI([
    { role: "system", content: "Extract primaryObjective (2-4 words), secondaryFeatures (array), category. Respond ONLY with JSON like {\"primaryObjective\":\"...\",\"secondaryFeatures\":[],\"category\":\"...\"}" },
    { role: "user", content: userInput },
  ]);
  
  var intent = { primaryObjective: "Smart Contract", secondaryFeatures: [], category: "TOKEN" };
  try {
    var raw = iResp.choices[0].message.content.replace(/```json\n?/g,"").replace(/```/g,"").trim();
    var m = raw.match(/\{[\s\S]*\}/);
    if (m) raw = m[0];
    intent = JSON.parse(raw);
    if (!intent.primaryObjective) intent.primaryObjective = "Smart Contract";
  } catch(e) { console.log(`   ⚠️ Intent parsing failed, using defaults`); }
  
  console.log(`   Objective: ${intent.primaryObjective}`);

  // Step 2: Keywords
  var words = (intent.primaryObjective || "contract").toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (intent.secondaryFeatures) words = [...words, ...intent.secondaryFeatures.map(f=>f.toLowerCase())];
  words = [...new Set(words)];
  console.log(`   Keywords: [${words.join(", ")}]`);

  // Step 3: Query vault
  console.log(`\n🔍 Querying vault...`);
  var vaultPatterns = await vault.queryVault(words);
  var patterns = [];
  
  if (vaultPatterns.length > 0) {
    console.log(`   ✅ Found ${vaultPatterns.length} patterns`);
    patterns = vaultPatterns;
  } else {
    console.log(`   ⚠️ Using templates`);
    patterns = Object.entries(FALLBACK_TEMPLATES).map(([id,t]) => {
      var s = t.tags.filter(tag => words.some(w => tag.includes(w) || w.includes(tag))).length;
      return { id, ...t, score: s, source: 'template' };
    }).filter(p => p.score > 0).sort((a,b) => b.score - a.score);
  }

  // Step 4: ALWAYS generate fresh via Venice AI
  console.log(`\n🧬 Generating contract via Venice AI...`);
  var patternContext = patterns.length > 0 
    ? `\n\nReference patterns from vault (use as inspiration, not copy-paste):\n${patterns.map((p,i)=>`Pattern ${i+1} (${p.name}):\n${p.code}`).join("\n\n")}`
    : "";
  var cr = await callAI([{ role:"system", content:"You are an expert Solidity developer. Generate a COMPLETE, compilable smart contract based on the user's request. Include all functions, events, mappings, and proper access control. Output ONLY valid Solidity code (^0.8.20). No explanations. No markdown." }, { role:"user", content: `Request: ${userInput}${patternContext}` }]);
  var code = cr.choices[0].message.content.replace(/```solidity\n?/g,"").replace(/```/g,"").trim();
  // Ensure it starts with 'contract'
  if (!code.startsWith('contract') && !code.startsWith('pragma') && !code.startsWith('//')) {
    code = 'contract Generated { ' + code + ' }';
  }

  if (code) console.log(`\n📄 Generated ${code.split("\n").length} lines`);

  // Step 5: Hash + IPFS + Store
  var codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
  console.log(`   🔐 Hash: ${codeHash.slice(0,20)}...`);

  // Save locally
  fs.writeFileSync(path.join(CODE_STORE_DIR, pid+".sol"), code);

  // IPFS
  var ipfsCid = null, ipfsUrl = null;
  try {
    var ipfsR = await uploadToIPFS(code, intent.primaryObjective, 'AI-generated: '+userInput, codeHash);
    if (ipfsR) { ipfsCid = ipfsR.cid; ipfsUrl = ipfsR.url; }
  } catch(e) {}

  // Store hash on-chain
  var name = intent.primaryObjective;
  var desc = `AI-generated: ${userInput}`;
  var feats = [...new Set(patterns.flatMap(p => p.features || []))];
  var storeR = await vault.storeHash(pid, name, desc, codeHash, words, feats);

  return {
    patternId: pid, intent, code, codeHash, txHash: storeR.txHash,
    ipfsCid, ipfsUrl, vaultAddr: VAULT_ADDRESS,
    patterns: patterns.map(p => p.name),
  };
}

(async () => {
  var input = process.argv[2];
  if (input) { await processRequest(input); process.exit(0); }
  console.log("Usage: node main.js \"your prompt\"");
})();
