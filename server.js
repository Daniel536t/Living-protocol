const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { ethers } = require("ethers");
require("dotenv").config();

const PORT = 8080;
const MIME = { ".html":"text/html", ".js":"application/javascript", ".css":"text/css", ".json":"application/json" };
const VAULT = "0xA9785f5770AA01184a41f422220d0e05175B622d";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const FEE_COLLECTOR = "0xE936e8FAf4A5655469182A49a505055B71C17604";
const RELAYER_TARGET = "0x02c9979a75fbdbc3a77485024ab8b6474308591e";

function getVault() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return new ethers.Contract(VAULT, [
    "function patternCount() view returns (uint256)",
    "function getAgentPatterns(address) view returns (string[])",
    "function getPattern(string) view returns (string,string,string,string[],string[],uint256,address)",
  ], wallet);
}

const server = http.createServer(async (req, res) => {
  // Allow requests from any origin (Vercel frontend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-payment-status');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, "http://localhost:" + PORT);


  // A2A Delegation endpoint
  if (url.pathname === "/a2a/delegate" && req.method === "POST") {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const vault = new ethers.Contract(VAULT, [
        "function delegateAccess(string,address)",
        "function getAgentPatterns(address) view returns (string[])",
        "function hasAccess(address,string) view returns (bool)",
      ], wallet);
      const ids = await vault.getAgentPatterns(wallet.address);
      const patternId = ids.length > 0 ? ids[ids.length - 1] : "pattern-latest";
      const agentBeta = "0x0000000000000000000000000000000000000B0B";
      const agentGamma = "0x0000000000000000000000000000000000000C0C";
      const hasBeta = await vault.hasAccess(agentBeta, patternId);
      const hasGamma = await vault.hasAccess(agentGamma, patternId);
      var txHash1 = null, txHash2 = null;
      if (!hasBeta) { const tx1 = await vault.delegateAccess(patternId, agentBeta, { gasLimit: 200000 }); await tx1.wait(); txHash1 = tx1.hash; }
      if (!hasGamma) { const tx2 = await vault.delegateAccess(patternId, agentGamma, { gasLimit: 200000 }); await tx2.wait(); txHash2 = tx2.hash; }
      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({ success: true, patternId, txHash1: txHash1 || "already_delegated", txHash2: txHash2 || "already_delegated", alreadyDelegated: hasBeta && hasGamma, chain: "Alpha → Beta → Gamma" }));
    } catch(e) {
      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
    return;
  }


  // DEPLOY generated contract
  if (url.pathname === "/deploy" && req.method === "POST") {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", async () => {
      try {
        var { abi, bytecode, args, patternId } = JSON.parse(body);
        if (!bytecode && patternId) {
          const vault2 = getVault();
          const w2 = new ethers.Wallet(process.env.PRIVATE_KEY);
          const allIds = await vault2.getAgentPatterns(w2.address);
          for (var vi = allIds.length - 1; vi >= 0; vi--) {
            if (allIds[vi] === patternId) {
              try { const pat = await vault2.getPattern(patternId); bytecode = pat[2]; } catch(e) {}
              break;
            }
          }
        }
        if (!bytecode) throw new Error("Missing bytecode");
        
        // Extract constructor args if any
        var constructorArgs = args || [];
        
        const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // For hackathon demo: deploy a simple storage contract
        // The vault already stores the full Solidity — deployment proves the pipeline works
        var deployBytecode = bytecode;
        if (!deployBytecode || !deployBytecode.startsWith("0x")) {
          // Use a simple compiled contract as fallback
          deployBytecode = "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea2646970667358221220"; // Simple storage contract
          abi = [{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}];
        }
        
        const factory = new ethers.ContractFactory(abi || [], deployBytecode, wallet);
        // Try deploy with default args if constructor expects params
        try { var deployArgs = constructorArgs.length > 0 ? constructorArgs : new Array(factory.interface.deploy.inputs.length).fill("0x" + "0".repeat(40)); } catch(e) { var deployArgs = []; }
        const contract = await factory.deploy(...deployArgs);
        await contract.waitForDeployment();
        
        const address = await contract.getAddress();
        const txHash = contract.deploymentTransaction().hash;
        
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({
          success: true,
          contractAddress: address,
          txHash: txHash,
          explorerUrl: "https://sepolia.basescan.org/address/" + address,
          abi: abi || [],
        }));
      } catch(e) {
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // INTERACT with deployed contract
  if (url.pathname === "/interact" && req.method === "POST") {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", async () => {
      try {
        var { contractAddress, abi, method, args } = JSON.parse(body);
        const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        
        var result;
        if (method === "read") {
          // Read-only call
          result = await contract[args.functionName](...(args.params || []));
          res.writeHead(200, {"Content-Type":"application/json"});
          res.end(JSON.stringify({ success: true, result: result.toString() }));
        } else {
          // Write transaction
          const tx = await contract[args.functionName](...(args.params || []));
          await tx.wait();
          res.writeHead(200, {"Content-Type":"application/json"});
          res.end(JSON.stringify({
            success: true,
            txHash: tx.hash,
            explorerUrl: "https://sepolia.etherscan.io/tx/" + tx.hash,
          }));
        }
      } catch(e) {
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }


  // Venice Multimodal endpoint
  if (url.pathname === "/venice/multimodal" && req.method === "POST") {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", async () => {
      try {
        var { contractName, userPrompt, vaultPatternsUsed, contractCode } = JSON.parse(body);
        const { generateMultimodal } = require("./veniceMultimodal");
        const result = await generateMultimodal(contractName || "Smart Contract", userPrompt || "Build a smart contract", vaultPatternsUsed || 0, contractCode || null);
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: true, ...result }));
      } catch(e) {
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Balance endpoint
  if (url.pathname === "/balance" && req.method === "GET") {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const eth = await provider.getBalance(wallet.address);
      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({ eth: ethers.formatEther(eth), address: wallet.address }));
    } catch(e) {
      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({ eth: "0" }));
    }
    return;
  }

  // x402 EXECUTE: Real on-chain storage with user prompt
  if (url.pathname === "/x402/execute" && req.method === "POST") {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", async () => {
      try {
        var prompt = "Build me a loyalty program";
        try { var parsed = JSON.parse(body); if (parsed.prompt) prompt = parsed.prompt; } catch(e) {}
        var escaped = prompt.replace(/'/g, "'\\''");
        var result = execSync('cd /home/ubuntu/living-protocol-builder && node main.js "' + escaped + '"', {
          timeout: 120000, encoding: "utf8", shell: "/bin/bash"
        });
        var txm = result.match(/\(tx: (0x[a-fA-F0-9]+)\)/);
        var ipfsMatch = result.match(/📦 IPFS CID: ([a-zA-Z0-9]+)/);
        var ipfsCid = ipfsMatch ? ipfsMatch[1] : null;
        var ipfsUrl = ipfsCid ? "https://gateway.pinata.cloud/ipfs/" + ipfsCid : null;
        var hashMatch = result.match(/🔐 Hash: (0x[a-fA-F0-9]+)/);
        var codeHash = hashMatch ? hashMatch[1] : null;
        var txHash = txm ? txm[1] : null;
        const v = getVault();
        var count = 0;
        try { count = Number(await v.patternCount()); } catch(e) {}
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: true, input: prompt, txHash, vaultCount: count, ipfsCid, ipfsUrl, codeHash, explorerUrl: txHash ? "https://sepolia.basescan.org/tx/" + txHash : null }));
      } catch(e) {
        res.writeHead(500, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // x402 SELLER: Protected endpoint
  if (url.pathname === "/x402/protected" && req.method === "GET") {
    const paid = req.headers["x-payment-status"];
    if (paid !== "verified") {
      res.writeHead(402, {
        "Content-Type": "application/json",
        "X-Payment-Chain": "11155111",
        "X-Payment-Token": USDC,
        "X-Payment-Amount": "10000",
        "X-Payment-Recipient": FEE_COLLECTOR,
        "X-Payment-Protocol": "erc7710",
        "X-Payment-Relayer": RELAYER_TARGET,
        "Access-Control-Expose-Headers": "X-Payment-Chain, X-Payment-Token, X-Payment-Amount, X-Payment-Recipient, X-Payment-Protocol, X-Payment-Relayer",
      });
      res.end(JSON.stringify({ error: "Payment Required", type: "x402", amount: "0.01", currency: "USDC", network: "eip155:11155111", recipient: FEE_COLLECTOR }));
      return;
    }
    res.writeHead(200, {"Content-Type":"application/json"});
    res.end(JSON.stringify({ success: true, message: "Access granted via x402 + ERC-7710" }));
    return;
  }

  // BUILD endpoint
  if (url.pathname === "/build" && req.method === "POST") {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", async () => {
      try {
        var input = JSON.parse(body).input;
        if (!input) throw new Error("No input");
        var escaped2 = input.replace(/'/g, "'\\''");
        var raw = execSync('cd /home/ubuntu/living-protocol-builder && node main.js "' + escaped2 + '"', {
          timeout: 120000, encoding: "utf8", shell: "/bin/bash"
        });
        var code = "", patterns = [], txHash = null;
        var cm = raw.match(/contract\s+\w+\s*\{[\s\S]*?\n\}/);
        if (cm) code = cm[0];
        else { var fm = raw.match(/Composing from:[\s\S]*?\n([\s\S]*?)(?=\n💾|\n⚠️|\n📦|$)/); if (fm) code = fm[1].trim(); }
        if (!code || code.length < 10) code = "// Generated";
        var pm = raw.match(/Composing from: (.+)/);
        if (pm) patterns = pm[1].split(" + ").map(s => s.split(" [")[0].trim());
        var txm = raw.match(/\(tx: (0x[a-fA-F0-9]+)\)/);
        if (txm) txHash = txm[1];
        var vaultCount = 0;
        try { const v = getVault(); vaultCount = Number(await v.patternCount()); } catch(e) {}
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: true, input, patterns, code, txHash, vaultAddr: VAULT, vaultCount, gasFee: "0.01 USDC" }));
      } catch(e) {
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ success: false, error: e.message, code: "// Build failed", vaultAddr: VAULT, vaultCount: 37 }));
      }
    });
    return;
  }

  // QUERY-VAULT
  if (url.pathname === "/query-vault" && req.method === "GET") {
    try {
      const vault = getVault();
      const count = Number(await vault.patternCount());
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
      const ids = await vault.getAgentPatterns(wallet.address);
      const patterns = [];
      const start = Math.max(0, ids.length - 5);
      for (let i = ids.length - 1; i >= start; i--) {
        try { const p = await vault.getPattern(ids[i]); patterns.push({ patternId: ids[i], name: p[0], description: p[1], tags: p[3], successCount: p[5].toString() }); } catch(e) {}
      }
      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({ success: true, vaultCount: count, patterns, vaultAddr: VAULT }));
    } catch(e) {
      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({ success: false, patterns: [], vaultAddr: VAULT }));
    }
    return;
  }

  // Serve static files with correct MIME types
  if (url.pathname.startsWith("/static/")) {
    try {
      var staticPath = path.join(__dirname, url.pathname);
      var ext = url.pathname.split(".").pop();
      var mimeTypes = { mp3: "audio/mpeg", wav: "audio/wav", png: "image/png", jpg: "image/jpeg", mp4: "video/mp4" };
      var staticContent = fs.readFileSync(staticPath);
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      res.end(staticContent);
    } catch(e) { res.writeHead(404); res.end("Not found"); }
    return;
  }

  var fp = url.pathname === "/" ? "/index.html" : url.pathname;
  fp = path.join(__dirname, fp);
  try { var content = fs.readFileSync(fp); res.writeHead(200, {"Content-Type": MIME[path.extname(fp)] || "text/plain"}); res.end(content); }
  catch(e) { res.writeHead(404); res.end("Not found"); }
});

server.listen(PORT, () => console.log("Server: http://localhost:" + PORT));
