const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AutoYieldVault", function () {
    let vault, usdc, avantisVault;
    let owner, operator, user1, user2;
    const DAILY_AMOUNT = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)
    const ONE_DAY = 24 * 60 * 60;

    beforeEach(async function () {
        [owner, operator, user1, user2] = await ethers.getSigners();

        // Deploy mock USDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        usdc = await MockUSDC.deploy();

        // Deploy mock AvantisFi vault
        const MockAvantisLPVault = await ethers.getContractFactory("MockAvantisLPVault");
        avantisVault = await MockAvantisLPVault.deploy(await usdc.getAddress());

        // Deploy AutoYield vault
        const AutoYieldVault = await ethers.getContractFactory("AutoYieldVault");
        vault = await AutoYieldVault.deploy(
            await usdc.getAddress(),
            await avantisVault.getAddress()
        );

        // Grant operator role
        const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
        await vault.grantRole(OPERATOR_ROLE, operator.address);

        // Mint USDC to users
        await usdc.mint(user1.address, ethers.parseUnits("1000", 6));
        await usdc.mint(user2.address, ethers.parseUnits("1000", 6));
    });

    describe("Subscription Management", function () {
        it("Should allow user to subscribe", async function () {
            // Approve USDC
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);

            // Subscribe
            await expect(vault.connect(user1).subscribe(DAILY_AMOUNT))
                .to.emit(vault, "Subscribed")
                .withArgs(user1.address, DAILY_AMOUNT, await time.latest() + 1);

            const sub = await vault.getSubscription(user1.address);
            expect(sub.dailyAmount).to.equal(DAILY_AMOUNT);
            expect(sub.isActive).to.be.true;
        });

        it("Should allow subscription with permit", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const nonce = await usdc.nonces(user1.address);

            const domain = {
                name: await usdc.name(),
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: await usdc.getAddress(),
            };

            const types = {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                ],
            };

            const value = {
                owner: user1.address,
                spender: await vault.getAddress(),
                value: ethers.MaxUint256,
                nonce: nonce,
                deadline: deadline,
            };

            const signature = await user1.signTypedData(domain, types, value);
            const { v, r, s } = ethers.Signature.from(signature);

            await expect(
                vault.connect(user1).subscribeWithPermit(DAILY_AMOUNT, deadline, v, r, s)
            )
                .to.emit(vault, "Subscribed")
                .withArgs(user1.address, DAILY_AMOUNT, await time.latest() + 1);
        });

        it("Should prevent duplicate subscriptions", async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);

            await expect(
                vault.connect(user1).subscribe(DAILY_AMOUNT)
            ).to.be.revertedWithCustomError(vault, "AlreadySubscribed");
        });

        it("Should allow user to unsubscribe", async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);

            await expect(vault.connect(user1).unsubscribe())
                .to.emit(vault, "Unsubscribed")
                .withArgs(user1.address, await time.latest() + 1);

            const sub = await vault.getSubscription(user1.address);
            expect(sub.isActive).to.be.false;
        });

        it("Should allow updating daily amount", async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);

            const newAmount = ethers.parseUnits("20", 6);
            await vault.connect(user1).updateDailyAmount(newAmount);

            const sub = await vault.getSubscription(user1.address);
            expect(sub.dailyAmount).to.equal(newAmount);
        });
    });

    describe("Daily Deduction Execution", function () {
        beforeEach(async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);
        });

        it("Should execute daily deduction and deposit to AvantisFi", async function () {
            const tx = await vault.connect(operator).executeDailyDeduction(user1.address);
            const receipt = await tx.wait();

            // Verify event emission
            await expect(tx)
                .to.emit(vault, "DailyDeductionExecuted")
                .withArgs(
                    user1.address,
                    DAILY_AMOUNT,
                    DAILY_AMOUNT, // 1:1 shares in mock
                    await time.latest()
                );

            // Verify state updates
            expect(await vault.avantisLPShares(user1.address)).to.equal(DAILY_AMOUNT);
            expect(await vault.totalDeposited(user1.address)).to.equal(DAILY_AMOUNT);

            const sub = await vault.getSubscription(user1.address);
            expect(sub.lastDeduction).to.equal(await time.latest());
        });

        it("Should prevent deduction before 24 hours", async function () {
            await vault.connect(operator).executeDailyDeduction(user1.address);

            await expect(
                vault.connect(operator).executeDailyDeduction(user1.address)
            ).to.be.revertedWithCustomError(vault, "DeductionTooSoon");
        });

        it("Should allow deduction after 24 hours", async function () {
            await vault.connect(operator).executeDailyDeduction(user1.address);

            // Fast forward 24 hours
            await time.increase(ONE_DAY);

            await expect(vault.connect(operator).executeDailyDeduction(user1.address))
                .to.emit(vault, "DailyDeductionExecuted");

            expect(await vault.totalDeposited(user1.address)).to.equal(DAILY_AMOUNT * 2n);
        });

        it("Should revert if user has insufficient USDC", async function () {
            // Transfer away user's USDC
            await usdc.connect(user1).transfer(user2.address, ethers.parseUnits("995", 6));

            await expect(
                vault.connect(operator).executeDailyDeduction(user1.address)
            ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
        });

        it("Should batch execute deductions for multiple users", async function () {
            // Setup second user
            await usdc.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user2).subscribe(DAILY_AMOUNT);

            await vault.connect(operator).batchExecuteDeductions([user1.address, user2.address]);

            expect(await vault.avantisLPShares(user1.address)).to.equal(DAILY_AMOUNT);
            expect(await vault.avantisLPShares(user2.address)).to.equal(DAILY_AMOUNT);
        });

        it("Should skip inactive users in batch", async function () {
            await usdc.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user2).subscribe(DAILY_AMOUNT);
            await vault.connect(user2).unsubscribe();

            await vault.connect(operator).batchExecuteDeductions([user1.address, user2.address]);

            expect(await vault.avantisLPShares(user1.address)).to.equal(DAILY_AMOUNT);
            expect(await vault.avantisLPShares(user2.address)).to.equal(0);
        });
    });

    describe("Withdrawal Functions", function () {
        beforeEach(async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);
            await vault.connect(operator).executeDailyDeduction(user1.address);
        });

        it("Should allow full withdrawal", async function () {
            const sharesBefore = await vault.avantisLPShares(user1.address);
            const usdcBefore = await usdc.balanceOf(user1.address);

            await expect(vault.connect(user1).withdraw())
                .to.emit(vault, "Withdrawn")
                .withArgs(user1.address, sharesBefore, DAILY_AMOUNT, await time.latest() + 1);

            expect(await vault.avantisLPShares(user1.address)).to.equal(0);
            expect(await usdc.balanceOf(user1.address)).to.equal(usdcBefore + DAILY_AMOUNT);
        });

        it("Should allow partial withdrawal", async function () {
            const partialShares = DAILY_AMOUNT / 2n;

            await vault.connect(user1).withdrawShares(partialShares);

            expect(await vault.avantisLPShares(user1.address)).to.equal(partialShares);
        });

        it("Should revert withdrawal with no shares", async function () {
            await expect(
                vault.connect(user2).withdraw()
            ).to.be.revertedWithCustomError(vault, "NoSharesToWithdraw");
        });

        it("Should include yield in withdrawal", async function () {
            // Simulate yield accrual (10% yield)
            const yieldAmount = DAILY_AMOUNT / 10n;
            await usdc.mint(owner.address, yieldAmount);
            await usdc.connect(owner).approve(await avantisVault.getAddress(), yieldAmount);
            await avantisVault.connect(owner).accrueYield(yieldAmount);

            const sharesBefore = await vault.avantisLPShares(user1.address);
            await vault.connect(user1).withdraw();

            // Should receive original deposit + yield
            const expectedAmount = DAILY_AMOUNT + yieldAmount;
            expect(await usdc.balanceOf(user1.address)).to.be.closeTo(
                ethers.parseUnits("990", 6) + expectedAmount,
                ethers.parseUnits("0.01", 6) // Allow small rounding error
            );
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);
            await vault.connect(operator).executeDailyDeduction(user1.address);
        });

        it("Should return correct total value", async function () {
            const totalValue = await vault.getUserTotalValue(user1.address);
            expect(totalValue).to.equal(DAILY_AMOUNT);
        });

        it("Should check if user can be deducted", async function () {
            expect(await vault.canDeductToday(user1.address)).to.be.false;

            await time.increase(ONE_DAY);

            expect(await vault.canDeductToday(user1.address)).to.be.true;
        });

        it("Should return subscription details", async function () {
            const sub = await vault.getSubscription(user1.address);
            expect(sub.dailyAmount).to.equal(DAILY_AMOUNT);
            expect(sub.isActive).to.be.true;
            expect(sub.lastDeduction).to.be.gt(0);
        });
    });

    describe("Emergency Functions", function () {
        beforeEach(async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);
            await vault.connect(operator).executeDailyDeduction(user1.address);
        });

        it("Should allow admin emergency withdrawal", async function () {
            await expect(vault.emergencyWithdrawFromAvantis(user1.address))
                .to.emit(vault, "EmergencyWithdrawal");

            expect(await vault.avantisLPShares(user1.address)).to.equal(0);
        });

        it("Should allow pausing contract", async function () {
            await vault.pause();

            await expect(
                vault.connect(user2).subscribe(DAILY_AMOUNT)
            ).to.be.revertedWithCustomError(vault, "EnforcedPause");
        });

        it("Should allow unpausing contract", async function () {
            await vault.pause();
            await vault.unpause();

            await usdc.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);
            await expect(vault.connect(user2).subscribe(DAILY_AMOUNT)).to.not.be.reverted;
        });

        it("Should restrict emergency functions to admin", async function () {
            await expect(
                vault.connect(user1).emergencyWithdrawFromAvantis(user1.address)
            ).to.be.reverted;

            await expect(vault.connect(user1).pause()).to.be.reverted;
        });
    });

    describe("Access Control", function () {
        it("Should restrict deduction execution to operator", async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);

            await expect(
                vault.connect(user1).executeDailyDeduction(user1.address)
            ).to.be.reverted;
        });

        it("Should allow granting operator role", async function () {
            const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
            await vault.grantRole(OPERATOR_ROLE, user2.address);

            expect(await vault.hasRole(OPERATOR_ROLE, user2.address)).to.be.true;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero subscription amount", async function () {
            await expect(
                vault.connect(user1).subscribe(0)
            ).to.be.revertedWithCustomError(vault, "InvalidAmount");
        });

        it("Should handle first-time deduction correctly", async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);

            // Should allow immediate first deduction
            expect(await vault.canDeductToday(user1.address)).to.be.true;
            await expect(vault.connect(operator).executeDailyDeduction(user1.address)).to.not.be.reverted;
        });

        it("Should handle multiple deposits and withdrawals", async function () {
            await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
            await vault.connect(user1).subscribe(DAILY_AMOUNT);

            // First deduction
            await vault.connect(operator).executeDailyDeduction(user1.address);
            await time.increase(ONE_DAY);

            // Second deduction
            await vault.connect(operator).executeDailyDeduction(user1.address);

            // Withdraw half
            const halfShares = (await vault.avantisLPShares(user1.address)) / 2n;
            await vault.connect(user1).withdrawShares(halfShares);

            // Continue deductions
            await time.increase(ONE_DAY);
            await expect(vault.connect(operator).executeDailyDeduction(user1.address)).to.not.be.reverted;
        });
    });
});
