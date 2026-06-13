const fs = require("fs");
let server = fs.readFileSync("server.js", "utf8");

// Insert /query-vault route before the static file handler
const insertPoint = server.indexOf("let fp = url.pathname");
const queryRoute = `
  if (url.pathname === "/query-vault" && req.method === "GET") {
    try {
      const { execSync } = require("child_process");
      const vaultAddr = fs.readFileSync(path.join(__dirname, ".vault-address"), "utf8").trim();
      const raw = execSync(
        'node -e "require(\\'dotenv\\').config();const{ethers}=require(\\'ethers\\');(async()=>{const p=new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);const v=new ethers.Contract(\\'' + vaultAddr + '\\',[\\'function getAgentPatterns(address) view returns (string[])\\'],[\\'function patternCount() view returns (uint256)\\'],[\\'function getPattern(string) view returns (string,string,string,string[],string[],uint256,address)\\'],p);const c=await v.patternCount();const patterns=[];for(let i=0;i<Math.min(Number(c),10);i++){try{const pid=await v.patternIndex(i);const p=await v.getPattern(pid);patterns.push({patternId:pid,name:p[0],description:p[1],tags:p[3],features:p[4],successCount:p[5].toString(),creator:p[6]});}catch(e){}}console.log(JSON.stringify(patterns));})();" 2>&1',
        { cwd: __dirname, timeout: 15000, encoding: "utf8" }
      );
      const patterns = JSON.parse(raw.trim().split("\n").pop() || "[]");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, patterns, vaultAddr }));
    } catch(e) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, patterns: [], error: e.message }));
    }
    return;
  }

`;

server = server.slice(0, insertPoint) + queryRoute + server.slice(insertPoint);
fs.writeFileSync("server.js", server);
console.log("✅ /query-vault route added");
