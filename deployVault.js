require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Load ABI and bytecode
  const abi = JSON.parse(fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.abi", "utf8"));
  const bytecode = fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.bin", "utf8");
  
  console.log(`Deployer: ${wallet.address}`);
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log("Deploying AgentMemoryVault...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`\n✅ Vault deployed at: ${address}`);
  
  // Save address
  fs.writeFileSync(".vault-address", address);
  console.log("Address saved to .vault-address");
}

main().catch(console.error);
