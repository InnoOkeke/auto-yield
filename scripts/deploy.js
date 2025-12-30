import hre from "hardhat";
import { ethers } from "ethers";
import process from "process";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("PRIVATE_KEY not set in .env");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const deployer = new ethers.Wallet(privateKey, provider);
    let currentNonce = await provider.getTransactionCount(deployer.address);

    console.log("Deploying contracts with account:", deployer.address, "Nonce:", currentNonce);
    // console.log("Account balance:", (await provider.getBalance(deployer.address)).toString());

    const networkName = process.env.HARDHAT_NETWORK || "base";
    console.log("Network:", networkName);

    // Contract addresses
    const usdcAddress = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const avantisLPVault = process.env.AVANTIS_LP_VAULT || "0x944766f715b51967E56aFdE5f0Aa76cEaCc9E7f9";

    console.log("\nUsing USDC address:", usdcAddress);
    console.log("Using AvantisFi LP Vault:", avantisLPVault);

    if (!avantisLPVault) {
        throw new Error("AVANTIS_LP_VAULT is required");
    }

    // Deploy AutoYieldFactory
    console.log("\nDeploying AutoYieldFactory...");
    const factoryArtifact = await hre.artifacts.readArtifact("AutoYieldFactory");
    const AutoYieldFactory = new ethers.ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, deployer);
    const factory = await AutoYieldFactory.deploy({ nonce: currentNonce++ });
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log("AutoYieldFactory deployed to:", factoryAddress);

    // Deploy AutoYieldVault
    console.log("\nDeploying AutoYieldVault...");
    const vaultArtifact = await hre.artifacts.readArtifact("AutoYieldVault");
    const AutoYieldVault = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, deployer);
    const vault = await AutoYieldVault.deploy(usdcAddress, avantisLPVault, { nonce: currentNonce++ });
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    console.log("AutoYieldVault deployed to:", vaultAddress);

    // Grant operator role to deployer
    const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
    const tx = await vault.grantRole(OPERATOR_ROLE, deployer.address, { nonce: currentNonce++ });
    await tx.wait();
    console.log("Granted OPERATOR_ROLE to:", deployer.address);

    console.log("\n✅ Deployment complete!");
    console.log("\n📝 Update your .env file with:");
    console.log(`VAULT_ADDRESS=${vaultAddress}`);
    console.log(`FACTORY_ADDRESS=${factoryAddress}`);

    // Verify contracts
    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("\n⏳ Waiting for block confirmations...");
        // Wait a bit more for indexers
        await new Promise(r => setTimeout(r, 10000));

        console.log("\n🔍 Verifying contracts on Basescan...");
        try {
            await hre.run("verify:verify", {
                address: vaultAddress,
                constructorArguments: [usdcAddress, avantisLPVault],
            });
            console.log("AutoYieldVault verified!");
        } catch (error) {
            console.log("Verification error:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: factoryAddress,
                constructorArguments: [],
            });
            console.log("AutoYieldFactory verified!");
        } catch (error) {
            console.log("Verification error:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
