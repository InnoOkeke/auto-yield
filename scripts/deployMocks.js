const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying mock contracts for testing with account:", deployer.address);

    // Deploy Mock USDC
    console.log("\nDeploying MockUSDC...");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    console.log("MockUSDC deployed to:", await usdc.getAddress());

    // Deploy Mock AvantisFi LP Vault
    console.log("\nDeploying MockAvantisLPVault...");
    const MockAvantisLPVault = await hre.ethers.getContractFactory("MockAvantisLPVault");
    const avantisVault = await MockAvantisLPVault.deploy(await usdc.getAddress());
    await avantisVault.waitForDeployment();
    console.log("MockAvantisLPVault deployed to:", await avantisVault.getAddress());

    // Deploy AutoYieldVault with mocks
    console.log("\nDeploying AutoYieldVault with mock contracts...");
    const AutoYieldVault = await hre.ethers.getContractFactory("AutoYieldVault");
    const vault = await AutoYieldVault.deploy(
        await usdc.getAddress(),
        await avantisVault.getAddress()
    );
    await vault.waitForDeployment();
    console.log("AutoYieldVault deployed to:", await vault.getAddress());

    // Grant operator role
    const OPERATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("OPERATOR_ROLE"));
    await vault.grantRole(OPERATOR_ROLE, deployer.address);
    console.log("Granted OPERATOR_ROLE to:", deployer.address);

    console.log("\n✅ Mock deployment complete!");
    console.log("\n📝 Contract addresses:");
    console.log(`MOCK_USDC=${await usdc.getAddress()}`);
    console.log(`MOCK_AVANTIS_VAULT=${await avantisVault.getAddress()}`);
    console.log(`VAULT_ADDRESS=${await vault.getAddress()}`);

    console.log("\n💡 Mint some test USDC with:");
    console.log(`npx hardhat console --network ${hre.network.name}`);
    console.log(`const usdc = await ethers.getContractAt("MockUSDC", "${await usdc.getAddress()}")`);
    console.log(`await usdc.mint("YOUR_ADDRESS", ethers.parseUnits("1000", 6))`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
