
const hre = require("hardhat");
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const provider = new hre.ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Get current nonce (next available)
    const currentNonce = await provider.getTransactionCount(wallet.address);
    console.log("Current Nonce:", currentNonce);

    // We deployed:
    // 1. Factory (Nonce - 7)
    // 2. Vault (Nonce - 6) 
    // 3. Grant Operator (Deployer) (Nonce - 5)
    // 4. Grant Operator (Treasury) (Nonce - 4)
    // 5. Grant Admin (Treasury) (Nonce - 3)
    // 6. Set Treasury (Nonce - 2)
    // 7. Set Fee (Nonce - 1)

    // So Vault was at currentNonce - 6?
    // Let's print addresses for a range to be safe.

    for (let i = 1; i <= 10; i++) {
        const nonce = currentNonce - i;
        if (nonce < 0) continue;
        const address = ethers.getCreateAddress({ from: wallet.address, nonce: nonce });
        console.log(`Nonce ${nonce}: ${address}`);
    }
}

main().catch(console.error);
