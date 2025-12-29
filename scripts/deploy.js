const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    const network = hre.network.name;
    console.log("Network:", network);

    // Contract addresses
    let usdcAddress, avantisLPVault;

    if (network === "base-sepolia") {
        usdcAddress = process.env.SEPOLIA_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
        avantisLPVault = process.env.SEPOLIA_AVANTIS_LP_VAULT || "";
    } else if (network === "base") {
        usdcAddress = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        avantisLPVault = process.env.AVANTIS_LP_VAULT || "";
    } else {
        throw new Error("Unsupported network. Use base-sepolia or base.");
    }

    if (!avantisLPVault) {
        console.log("\n⚠️  Warning: AVANTIS_LP_VAULT not set in .env");
        console.log("Please set the AvantisFi LP Vault address for your target network.");
        console.log("\nFor testing, you can deploy mock contracts instead:");
        console.log("Run: npx hardhat run scripts/deployMocks.js --network " + network);
        return;
    }

    console.log("\nUsing USDC address:", usdcAddress);
    console.log("Using AvantisFi LP Vault:", avantisLPVault);

    // Deploy AutoYieldFactory
    console.log("\nDeploying AutoYieldFactory...");
    const AutoYieldFactory = await hre.ethers.getContractFactory("AutoYieldFactory");
    const factory = await AutoYieldFactory.deploy();
    await factory.waitForDeployment();

    console.log("AutoYieldFactory deployed to:", await factory.getAddress());

    // Deploy AutoYieldVault
    console.log("\nDeploying AutoYieldVault...");
    const AutoYieldVault = await hre.ethers.getContractFactory("AutoYieldVault");
    const vault = await AutoYieldVault.deploy(usdcAddress, avantisLPVault);
    await vault.waitForDeployment();

    console.log("AutoYieldVault deployed to:", await vault.getAddress());

    // Grant operator role to deployer (will be changed to backend relayer later)
    const OPERATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("OPERATOR_ROLE"));
    await vault.grantRole(OPERATOR_ROLE, deployer.address);
    console.log("Granted OPERATOR_ROLE to:", deployer.address);

    console.log("\n✅ Deployment complete!");
    console.log("\n📝 Update your .env file with:");
    console.log(`VAULT_ADDRESS=${await vault.getAddress()}`);
    console.log(`FACTORY_ADDRESS=${await factory.getAddress()}`);

    // Verify contracts on explorer
    if (network !== "hardhat" && network !== "localhost") {
        console.log("\n⏳ Waiting for block confirmations...");
        await vault.deploymentTransaction().wait(5);

        console.log("\n🔍 Verifying contracts on Basescan...");
        try {
            await hre.run("verify:verify", {
                address: await vault.getAddress(),
                constructorArguments: [usdcAddress, avantisLPVault],
            });
            console.log("AutoYieldVault verified!");
        } catch (error) {
            console.log("Verification error:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: await factory.getAddress(),
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
