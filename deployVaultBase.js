require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const abi = JSON.parse(fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.abi", "utf8"));
  const bytecode = fs.readFileSync("build/contracts_AgentMemoryVault_sol_AgentMemoryVault.bin", "utf8");
  
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH`);
  console.log(`Chain: Base Sepolia\n`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`✅ Vault: ${address}`);
  console.log(`Explorer: https://sepolia.basescan.org/address/${address}`);
  
  fs.writeFileSync(".vault-address-base", address);
}

main().catch(console.error);
