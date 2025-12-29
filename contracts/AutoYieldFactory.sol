// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AutoYieldVault.sol";

/**
 * @title AutoYieldFactory
 * @notice Factory contract for deploying AutoYield vaults for different yield strategies
 * @dev Future-proofs the system for multiple yield protocols beyond AvantisFi
 */
contract AutoYieldFactory is Ownable {
    // ============ State Variables ============
    address[] public deployedVaults;
    mapping(address => bool) public isVault;
    
    // ============ Events ============
    event VaultDeployed(
        address indexed vault,
        address indexed usdc,
        address indexed yieldProtocol,
        string strategyName,
        uint256 timestamp
    );
    
    // ============ Constructor ============
    constructor() Ownable(msg.sender) {}
    
    // ============ Main Functions ============
    
    /**
     * @notice Deploy a new AutoYield vault
     * @param usdc USDC token address
     * @param yieldProtocol Yield protocol vault address (e.g., AvantisFi LP Vault)
     * @param strategyName Human-readable strategy name (e.g., "AvantisFi USDC LP")
     * @return vault Address of the newly deployed vault
     */
    function deployVault(
        address usdc,
        address yieldProtocol,
        string memory strategyName
    ) external onlyOwner returns (address vault) {
        // Deploy new vault
        AutoYieldVault newVault = new AutoYieldVault(usdc, yieldProtocol);
        vault = address(newVault);
        
        // Track deployment
        deployedVaults.push(vault);
        isVault[vault] = true;
        
        emit VaultDeployed(vault, usdc, yieldProtocol, strategyName, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get total number of deployed vaults
     */
    function getVaultCount() external view returns (uint256) {
        return deployedVaults.length;
    }
    
    /**
     * @notice Get all deployed vault addresses
     */
    function getAllVaults() external view returns (address[] memory) {
        return deployedVaults;
    }
}
