require("dotenv").config();
const { ethers } = require("ethers");

async function deployContract(abi, bytecode, constructorArgs = []) {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(...constructorArgs);
  await contract.waitForDeployment();
  
  return {
    address: await contract.getAddress(),
    txHash: contract.deploymentTransaction().hash,
    abi: abi,
  };
}

// CLI: takes ABI and bytecode from stdin or args
async function main() {
  const input = JSON.parse(process.argv[2] || "{}");
  const result = await deployContract(input.abi, input.bytecode, input.args || []);
  console.log(JSON.stringify(result));
}

if (require.main === module) {
  main().catch(e => { console.error(JSON.stringify({ error: e.message })); process.exit(1); });
}

module.exports = { deployContract };
