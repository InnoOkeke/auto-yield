const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AutoYieldFactory", function () {
    let factory, usdc, avantisVault;
    let owner, user1;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy mocks
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        usdc = await MockUSDC.deploy();

        const MockAvantisLPVault = await ethers.getContractFactory("MockAvantisLPVault");
        avantisVault = await MockAvantisLPVault.deploy(await usdc.getAddress());

        // Deploy factory
        const AutoYieldFactory = await ethers.getContractFactory("AutoYieldFactory");
        factory = await AutoYieldFactory.deploy();
    });

    describe("Vault Deployment", function () {
        it("Should deploy a new vault", async function () {
            const tx = await factory.deployVault(
                await usdc.getAddress(),
                await avantisVault.getAddress(),
                "AvantisFi USDC LP"
            );

            await expect(tx).to.emit(factory, "VaultDeployed");

            const vaultCount = await factory.getVaultCount();
            expect(vaultCount).to.equal(1);
        });

        it("Should track deployed vaults", async function () {
            await factory.deployVault(
                await usdc.getAddress(),
                await avantisVault.getAddress(),
                "Strategy 1"
            );

            await factory.deployVault(
                await usdc.getAddress(),
                await avantisVault.getAddress(),
                "Strategy 2"
            );

            const vaults = await factory.getAllVaults();
            expect(vaults.length).to.equal(2);

            expect(await factory.isVault(vaults[0])).to.be.true;
            expect(await factory.isVault(vaults[1])).to.be.true;
        });

        it("Should restrict deployment to owner", async function () {
            await expect(
                factory.connect(user1).deployVault(
                    await usdc.getAddress(),
                    await avantisVault.getAddress(),
                    "Unauthorized"
                )
            ).to.be.reverted;
        });
    });

    describe("Deployed Vault Functionality", function () {
        it("Should create functional vaults", async function () {
            const tx = await factory.deployVault(
                await usdc.getAddress(),
                await avantisVault.getAddress(),
                "Test Strategy"
            );

            const receipt = await tx.wait();
            const vaults = await factory.getAllVaults();
            const vaultAddress = vaults[0];

            // Interact with deployed vault
            const AutoYieldVault = await ethers.getContractFactory("AutoYieldVault");
            const vault = AutoYieldVault.attach(vaultAddress);

            // Test subscription
            await usdc.mint(user1.address, ethers.parseUnits("100", 6));
            await usdc.connect(user1).approve(vaultAddress, ethers.MaxUint256);

            await expect(
                vault.connect(user1).subscribe(ethers.parseUnits("10", 6))
            ).to.emit(vault, "Subscribed");
        });
    });
});
