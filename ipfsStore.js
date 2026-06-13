require("dotenv").config();
const PinataSDK = require("@pinata/sdk");

const pinata = new PinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

async function uploadToIPFS(code, patternName, description, codeHash) {
  try {
    const result = await pinata.pinJSONToIPFS({
      name: patternName || "Smart Contract",
      description: description || "",
      code: code,
      codeHash: codeHash || "",
      timestamp: new Date().toISOString(),
      generator: "Living Protocol Builder — Venice AI",
      network: "Base Sepolia",
    });
    
    console.log(`   📦 IPFS CID: ${result.IpfsHash}`);
    return {
      cid: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    };
  } catch(e) {
    console.log(`   ⚠️ IPFS upload skipped: ${e.message.slice(0,60)}`);
    return null;
  }
}

module.exports = { uploadToIPFS };
