// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IAvantisLPVault
 * @notice Interface for AvantisFi LP Vault (avUSDC)
 */
interface IAvantisLPVault {
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function totalAssets() external view returns (uint256);
}

/**
 * @title AutoYieldVault
 * @notice Core vault contract for AutoYield - manages user subscriptions and automated USDC deductions
 * @dev Implements gasless meta-transactions via EIP-2612 permits with direct AvantisFi LP Vault integration
 */
contract AutoYieldVault is AccessControl, ReentrancyGuard, Pausable {
    // ============ Roles ============
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // ============ State Variables ============
    IERC20 public immutable usdc;
    IERC20Permit public immutable usdcPermit;
    IAvantisLPVault public immutable avantisLPVault;
    
    uint256 public platformFeeBps; // Basis points (e.g. 50 = 0.5%)
    address public treasury;

    // ============ Structs ============
    struct Subscription {
        uint256 dailyAmount;      // Daily deduction amount in USDC (6 decimals)
        bool isActive;            // Subscription status
        uint256 startDate;        // Subscription start timestamp
        uint256 lastDeduction;    // Last successful deduction timestamp
    }
    
    // ============ Storage ============
    mapping(address => Subscription) public subscriptions;
    mapping(address => uint256) public avantisLPShares;     // User's AvantisFi LP shares
    mapping(address => uint256) public pendingRewards;      // Unclaimed trading fee rewards
    mapping(address => uint256) public totalDeposited;      // Total USDC deposited by user
    
    // ============ Events ============
    event Subscribed(address indexed user, uint256 dailyAmount, uint256 timestamp);
    event Unsubscribed(address indexed user, uint256 timestamp);
    event DailyDeductionExecuted(
        address indexed user,
        uint256 amount,
        uint256 avantisShares,
        uint256 timestamp
    );
    event Withdrawn(
        address indexed user,
        uint256 shares,
        uint256 usdcAmount,
        uint256 timestamp
    );
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyWithdrawal(address indexed user, uint256 shares, uint256 usdcAmount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FeeCollected(address indexed user, uint256 amount, uint256 timestamp);
    
    // ============ Errors ============
    error AlreadySubscribed();
    error NotSubscribed();
    error InvalidAmount();
    error DeductionTooSoon();
    error InsufficientBalance();
    error NoRewardsToClaim();
    error NoSharesToWithdraw();
    
    // ============ Constructor ============
    /**
     * @param _usdc Base USDC token address (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
     * @param _avantisLPVault AvantisFi LP Vault address for avUSDC
     */
    constructor(address _usdc, address _avantisLPVault) {
        usdc = IERC20(_usdc);
        usdcPermit = IERC20Permit(_usdc);
        avantisLPVault = IAvantisLPVault(_avantisLPVault);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        // Approve AvantisFi vault for max USDC spending
        usdc.approve(_avantisLPVault, type(uint256).max);
    }
    
    // ============ Subscription Management ============
    
    /**
     * @notice Subscribe to AutoYield with gasless EIP-2612 permit
     * @param dailyAmount Daily USDC deduction amount (6 decimals)
     * @param deadline Permit signature deadline
     * @param v ECDSA signature parameter
     * @param r ECDSA signature parameter
     * @param s ECDSA signature parameter
     */
    function subscribeWithPermit(
        uint256 dailyAmount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        if (subscriptions[msg.sender].isActive) revert AlreadySubscribed();
        if (dailyAmount == 0) revert InvalidAmount();
        
        // Execute permit for future deductions (approve max amount)
        usdcPermit.permit(
            msg.sender,
            address(this),
            type(uint256).max,
            deadline,
            v,
            r,
            s
        );
        
        subscriptions[msg.sender] = Subscription({
            dailyAmount: dailyAmount,
            isActive: true,
            startDate: block.timestamp,
            lastDeduction: 0 // No deductions yet
        });
        
        emit Subscribed(msg.sender, dailyAmount, block.timestamp);
    }
    
    /**
     * @notice Subscribe to AutoYield (fallback method requiring prior USDC approval)
     * @param dailyAmount Daily USDC deduction amount (6 decimals)
     */
    function subscribe(uint256 dailyAmount) external whenNotPaused {
        if (subscriptions[msg.sender].isActive) revert AlreadySubscribed();
        if (dailyAmount == 0) revert InvalidAmount();
        
        subscriptions[msg.sender] = Subscription({
            dailyAmount: dailyAmount,
            isActive: true,
            startDate: block.timestamp,
            lastDeduction: 0
        });
        
        emit Subscribed(msg.sender, dailyAmount, block.timestamp);
    }
    
    /**
     * @notice Unsubscribe from AutoYield (funds remain in AvantisFi until withdrawn)
     */
    function unsubscribe() external {
        if (!subscriptions[msg.sender].isActive) revert NotSubscribed();
        
        subscriptions[msg.sender].isActive = false;
        
        emit Unsubscribed(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Update daily deduction amount
     * @param newDailyAmount New daily USDC amount (6 decimals)
     */
    function updateDailyAmount(uint256 newDailyAmount) external {
        if (!subscriptions[msg.sender].isActive) revert NotSubscribed();
        if (newDailyAmount == 0) revert InvalidAmount();
        
        subscriptions[msg.sender].dailyAmount = newDailyAmount;
    }
    
    // ============ Admin Functions ============

    /**
     * @notice Set platform fee in basis points
     * @param _bps Fee in basis points (e.g. 50 = 0.5%)
     */
    function setPlatformFee(uint256 _bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit PlatformFeeUpdated(platformFeeBps, _bps);
        platformFeeBps = _bps;
    }

    /**
     * @notice Set treasury address for fee collection
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    // ============ Daily Deduction Execution ============
    
    /**
     * @notice Execute daily deduction for a user and deposit directly to AvantisFi
     * @dev Called by backend relayer (OPERATOR_ROLE) - pays gas on behalf of user
     * @param user User address to deduct from
     */
    function executeDailyDeduction(address user) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        Subscription storage sub = subscriptions[user];
        
        if (!sub.isActive) revert NotSubscribed();
        
        // Ensure 24 hours have passed since last deduction
        if (sub.lastDeduction != 0 && block.timestamp < sub.lastDeduction + 1 days) {
            revert DeductionTooSoon();
        }
        
        uint256 totalAmount = sub.dailyAmount;
        
        // Check user has sufficient USDC balance
        if (usdc.balanceOf(user) < totalAmount) revert InsufficientBalance();
        
        uint256 depositAmount = totalAmount;

        // Deduct Fee
        if (platformFeeBps > 0 && treasury != address(0)) {
            uint256 fee = (totalAmount * platformFeeBps) / 10000;
            if (fee > 0) {
                usdc.transferFrom(user, treasury, fee);
                depositAmount -= fee;
                emit FeeCollected(user, fee, block.timestamp);
            }
        }
        
        // Transfer USDC from user to vault
        usdc.transferFrom(user, address(this), depositAmount);
        
        // Immediately deposit to AvantisFi and receive LP shares
        uint256 sharesReceived = avantisLPVault.deposit(depositAmount);
        
        // Update user's state
        avantisLPShares[user] += sharesReceived;
        totalDeposited[user] += totalAmount; // We track total pulled from wallet, or deposited? Let's track total amount users put in.
        sub.lastDeduction = block.timestamp;
        
        emit DailyDeductionExecuted(user, depositAmount, sharesReceived, block.timestamp);
    }
    
    /**
     * @notice Batch execute daily deductions for multiple users
     * @dev Gas-optimized batch processing
     * @param users Array of user addresses
     */
    function batchExecuteDeductions(address[] calldata users) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        uint256 length = users.length;
        for (uint256 i = 0; i < length;) {
            address user = users[i];
            Subscription storage sub = subscriptions[user];
            
            // Skip if not active or too soon
            if (sub.isActive && 
                (sub.lastDeduction == 0 || block.timestamp >= sub.lastDeduction + 1 days)) {
                
                uint256 totalAmount = sub.dailyAmount;
                
                // Skip if insufficient balance
                if (usdc.balanceOf(user) >= totalAmount) {
                    uint256 depositAmount = totalAmount;

                    // Deduct Fee
                    if (platformFeeBps > 0 && treasury != address(0)) {
                        uint256 fee = (totalAmount * platformFeeBps) / 10000;
                        if (fee > 0) {
                            usdc.transferFrom(user, treasury, fee);
                            depositAmount -= fee;
                            emit FeeCollected(user, fee, block.timestamp);
                        }
                    }

                    // Transfer and deposit
                    usdc.transferFrom(user, address(this), depositAmount);
                    uint256 sharesReceived = avantisLPVault.deposit(depositAmount);
                    
                    // Update state
                    avantisLPShares[user] += sharesReceived;
                    totalDeposited[user] += totalAmount;
                    sub.lastDeduction = block.timestamp;
                    
                    emit DailyDeductionExecuted(user, depositAmount, sharesReceived, block.timestamp);
                }
            }
            
            unchecked { ++i; }
        }
    }
    
    // ============ Withdrawal Functions ============
    
    /**
     * @notice Withdraw all AvantisFi LP shares and convert to USDC
     */
    function withdraw() external nonReentrant whenNotPaused {
        uint256 shares = avantisLPShares[msg.sender];
        if (shares == 0) revert NoSharesToWithdraw();
        
        // Clear user's shares first (CEI pattern)
        avantisLPShares[msg.sender] = 0;
        
        // Withdraw from AvantisFi and receive USDC
        uint256 usdcAmount = avantisLPVault.withdraw(shares);
        
        // Transfer USDC to user
        usdc.transfer(msg.sender, usdcAmount);
        
        emit Withdrawn(msg.sender, shares, usdcAmount, block.timestamp);
    }
    
    /**
     * @notice Withdraw specific amount of LP shares
     * @param shares Amount of LP shares to withdraw
     */
    function withdrawShares(uint256 shares) external nonReentrant whenNotPaused {
        if (shares == 0 || shares > avantisLPShares[msg.sender]) revert InvalidAmount();
        
        avantisLPShares[msg.sender] -= shares;
        
        uint256 usdcAmount = avantisLPVault.withdraw(shares);
        usdc.transfer(msg.sender, usdcAmount);
        
        emit Withdrawn(msg.sender, shares, usdcAmount, block.timestamp);
    }
    
    // ============ Rewards Management ============
    
    /**
     * @notice Claim accumulated trading fee rewards
     * @dev Rewards are distributed pro-rata based on LP share holdings
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 rewards = pendingRewards[msg.sender];
        if (rewards == 0) revert NoRewardsToClaim();
        
        pendingRewards[msg.sender] = 0;
        usdc.transfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards, block.timestamp);
    }
    
    /**
     * @notice Distribute trading fee rewards to users (operator function)
     * @dev Called periodically by backend after AvantisFi reward claims
     * @param users Array of user addresses
     * @param amounts Array of reward amounts for each user
     */
    function distributeRewards(address[] calldata users, uint256[] calldata amounts) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(users.length == amounts.length, "Length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            pendingRewards[users[i]] += amounts[i];
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get user's total value in USDC (LP shares converted to USDC)
     * @param user User address
     * @return Total USDC value of user's holdings
     */
    function getUserTotalValue(address user) external view returns (uint256) {
        uint256 shares = avantisLPShares[user];
        if (shares == 0) return 0;
        
        // Calculate USDC value: shares * totalAssets / totalSupply
        uint256 totalAssets = avantisLPVault.totalAssets();
        uint256 totalSupply = avantisLPVault.totalSupply();
        
        return (shares * totalAssets) / totalSupply;
    }
    
    /**
     * @notice Check if user can be deducted today
     * @param user User address
     * @return bool True if 24 hours have passed since last deduction
     */
    function canDeductToday(address user) external view returns (bool) {
        Subscription memory sub = subscriptions[user];
        if (!sub.isActive) return false;
        if (sub.lastDeduction == 0) return true;
        return block.timestamp >= sub.lastDeduction + 1 days;
    }
    
    /**
     * @notice Get subscription details for a user
     * @param user User address
     * @return Subscription struct
     */
    function getSubscription(address user) external view returns (Subscription memory) {
        return subscriptions[user];
    }
    
    // ============ Emergency Functions ============
    
    /**
     * @notice Emergency withdraw user funds from AvantisFi (admin only)
     * @dev Used in case of AvantisFi protocol issues
     * @param user User address to withdraw for
     */
    function emergencyWithdrawFromAvantis(address user) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        nonReentrant 
    {
        uint256 shares = avantisLPShares[user];
        if (shares == 0) revert NoSharesToWithdraw();
        
        avantisLPShares[user] = 0;
        
        uint256 usdcAmount = avantisLPVault.withdraw(shares);
        usdc.transfer(user, usdcAmount);
        
        emit EmergencyWithdrawal(user, shares, usdcAmount);
    }
    
    /**
     * @notice Pause contract (emergency only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
