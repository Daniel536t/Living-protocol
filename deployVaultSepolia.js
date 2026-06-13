require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const abi = JSON.parse(fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.abi", "utf8"));
  const bytecode = fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.bin", "utf8");
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Network: Sepolia\n`);
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log("Deploying AgentMemoryVault...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`\n✅ Vault deployed at: ${address}`);
  console.log(`   Explorer: https://sepolia.etherscan.io/address/${address}`);
  
  fs.writeFileSync(".vault-address", address);
  console.log("Address saved to .vault-address");
}

main().catch(console.error);
