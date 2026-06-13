const { ethers } = require("ethers");
const { assertAddress } = require("../core/types");

function build7702Authorization({ wallet, contract, chainId, provider }) {
  assertAddress(wallet.address, "wallet");
  assertAddress(contract, "contract");
  if (!provider) throw new Error("Missing provider");

  return async function sign() {
    const nonce = await provider.getTransactionCount(wallet.address);
    const domain = { name: "EIP-7702 Authorization", version: "1", chainId };
    const types = { Authorization: [{ name: "address", type: "address" }, { name: "chainId", type: "uint256" }, { name: "nonce", type: "uint256" }] };
    const message = { address: contract, chainId, nonce };
    const signature = await wallet.signTypedData(domain, types, message);
    return [{ address: contract, chainId, nonce, signature }];
  };
}
module.exports = { build7702Authorization };
