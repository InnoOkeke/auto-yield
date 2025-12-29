// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAvantisLPVault
 * @notice Mock AvantisFi LP Vault for testing
 * @dev Simplified version simulating deposit/withdraw with 1:1 share ratio
 */
contract MockAvantisLPVault is ERC20 {
    IERC20 public immutable asset;
    uint256 public totalAssets;
    
    constructor(address _asset) ERC20("Avantis LP USDC", "avUSDC") {
        asset = IERC20(_asset);
    }
    
    /**
     * @notice Deposit assets and receive shares
     * @param amount Amount of assets to deposit
     * @return shares Amount of shares minted
     */
    function deposit(uint256 amount) external returns (uint256 shares) {
        // Transfer assets from user
        asset.transferFrom(msg.sender, address(this), amount);
        
        // Calculate shares (simplified 1:1 for testing, can add yield simulation)
        if (totalSupply() == 0) {
            shares = amount;
        } else {
            shares = (amount * totalSupply()) / totalAssets;
        }
        
        totalAssets += amount;
        _mint(msg.sender, shares);
        
        return shares;
    }
    
    /**
     * @notice Withdraw shares and receive assets
     * @param shares Amount of shares to burn
     * @return amount Amount of assets returned
     */
    function withdraw(uint256 shares) external returns (uint256 amount) {
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        // Calculate assets to return
        amount = (shares * totalAssets) / totalSupply();
        
        _burn(msg.sender, shares);
        totalAssets -= amount;
        
        asset.transfer(msg.sender, amount);
        
        return amount;
    }
    
    /**
     * @notice Simulate yield accrual
     * @param yieldAmount Amount of yield to add to total assets
     */
    function accrueYield(uint256 yieldAmount) external {
        asset.transferFrom(msg.sender, address(this), yieldAmount);
        totalAssets += yieldAmount;
    }
}
