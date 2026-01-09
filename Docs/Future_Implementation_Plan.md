# Future Implementation Plan

This document outlines the technical roadmap for implementing the major "Next Steps" for Meluri AutoYield.

---

## 1. Smart Portfolio (AI-Driven Yield Routing)

**Goal:** Automatically move user funds to the highest-yielding protocol on Base (e.g., Aave, Compound, Moonwell, Avantis) without user intervention.

### A. Smart Contract Architecture
We need to refactor the `AutoYieldVault` to support multiple **Strategies**.

1.  **Strategy Interface (ERC-4626 compatible):**
    Create a standard interface that all strategies must implement:
    ```solidity
    interface IStrategy {
        function deposit(uint256 amount) external returns (uint256);
        function withdraw(uint256 amount) external returns (uint256);
        function estimatedAPY() external view returns (uint256);
        function totalValue() external view returns (uint256);
    }
    ```

2.  **Strategy Manager Contract:**
    *   Maintains a list of "Whitelisted Strategies" (to prevent rug pulls).
    *   `setActiveStrategy(address newStrategy)`: An admin-only function (controlled by TimeLock + Backend).
    *   `rebalance()`: Withdraws all funds from the old strategy and deposits into the new one.

### B. Backend (The "Brain")
1.  **Yield Scraper Service:**
    *   A new Cron job running every hour.
    *   Fetches APY data from DefiLlama API or direct on-chain calls to Aave/Moonwell.
    *   Stores historical APY in the database.

2.  **AI Decision Logic:**
    *   Simple Logic: `if (New_APY > Current_APY + Threshold_To_Cover_Gas)`, trigger rebalance.
    *   Complexity: Account for withdrawal fees, unbonding periods, and risk scores.

### C. Chatbot Integration
*   Update the System Prompt to have access to the *reasoning* behind the move.
*   User: "Why did my funds move to Aave?"
*   AI: "Moonwell rates dropped to 2%, but Aave is offering 12% today. We moved your funds to capture that 10% difference."

---

## 2. Farcaster Notifications

**Goal:** Send a push notification to the user's phone (via Warpcast) whenever they earn yield or a deposit is executed.

### A. Frontend (Request Permission)
1.  **Update `frame/src/lib/farcaster.ts`:**
    *   Use the `farcaster.actions.addNotification` API (Frames v2).
    *   Add a "Notify Me" toggle in the Dashboard settings.
    *   When clicked, validatate the user's FID and request notification permissions.

2.  **Store Webhook Token:**
    *   When the user accepts, Farcaster returns a `notification_url` and `token`.
    *   Save these in the PostgreSQL database under the `User` table:
        ```prisma
        model User {
          ...
          notificationUrl   String?
          notificationToken String?
        }
        ```

### B. Backend (Trigger)
1.  **Event Listeners:**
    *   In `backend/src/services/deduction.js`, after a successful `executeDailyDeduction` transaction:
    *   Call the `sendNotification(user, message)` function.

2.  **Notification Disptacher:**
    ```javascript
    async function sendNotification(user, message) {
      if (!user.notificationUrl) return;
      
      await axios.post(user.notificationUrl, {
        title: "AutoYield Earnings",
        body: message, // "💰 Saved $10 today!"
        target_url: "https://autoyield.vercel.app/dashboard"
      }, {
        headers: { Authorization: `Bearer ${user.notificationToken}` }
      });
    }
    ```

---

## 3. Bankr Bot Integration (AI Swaps)

**Goal:** Allow users to swap *any* token (ETH, DEGEN, HIGHER) into USDC directly within the app using **Bankr Bot's AI Engine**.

### A. Integration Strategy
Instead of building a custom DEX aggregator, we will use the `@bankr/sdk` to power a "Smart Swap" feature.

1.  **Backend Integration:**
    *   Install SDK: `npm install @bankr/sdk`
    *   New Endpoint: `POST /api/bankr/swap`
    *   Logic:
        ```javascript
        import { BankrClient } from '@bankr/sdk';
        
        const bankr = new BankrClient({ apiKey: process.env.BANKR_API_KEY });
        
        router.post('/swap', async (req, res) => {
            const { prompt, userAddress } = req.body; 
            // prompt: "Swap 0.1 ETH to USDC on Base"
            
            const tx = await bankr.generateTransaction({
                prompt,
                chain: 'base',
                sender: userAddress
            });
            
            res.json(tx);
        });
        ```

2.  **Frontend "Fund Wallet" Modal:**
    *   User clicks "Add Funds".
    *   Input: "I want to convert 500 DEGEN to USDC".
    *   App calls Backend -> Bankr.
    *   App prompts user to sign the returned transaction.

### B. Why this is better than On-Ramp?
*   **Native to Farcaster:** Users often hold meme tokens (DEGEN, TOSHI) rather than fiat.
*   **AI Powered:** Users can use natural language.
*   **Zero Maintenance:** Bankr handles the routing and liquidity finding.
