require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const abi = JSON.parse(fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.abi", "utf8"));
  const bytecode = fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.bin", "utf8");
  
  console.log("Deployer:", wallet.address);
  console.log("ETH:", ethers.formatEther(await provider.getBalance(wallet.address)));
  console.log("Network: Base Mainnet\n");

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log("Deploying AgentMemoryVault to Base Mainnet...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("\n✅ Vault deployed:", address);
  console.log("Explorer: https://basescan.org/address/" + address);
  
  fs.writeFileSync(".vault-address-mainnet", address);
}

main().catch(console.error);
