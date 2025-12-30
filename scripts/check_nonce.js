
const hre = require("hardhat");
require("dotenv").config();

async function main() {
    const provider = new hre.ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const nonce = await provider.getTransactionCount(wallet.address);
    const pending = await provider.getTransactionCount(wallet.address, "pending");

    console.log(`Address: ${wallet.address}`);
    console.log(`Confirmed Nonce: ${nonce}`);
    console.log(`Pending Nonce: ${pending}`);
}

main().catch(console.error);
