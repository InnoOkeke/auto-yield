# AutoYield Vision & Features

## 🔭 Vision: What exactly will we build?

Our vision is to make **DeFi invisible**.

Right now, "saving money" in crypto feels like a part-time job. You have to monitor rates, approve transactions, pay gas fees, and manually compound earnings. It's built for power users, not people.

We are building the first **autonomous savings protocol** that lives entirely within your social feed. We envision a future where a user can scroll through Farcaster, see a "Save" button, click it once, and then... never think about it again. Behind the scenes, AutoYield works tirelessly—optimizing yields, paying gas fees, and compounding wealth—while the user just lives their life.

We aren't just building a vault; we are building an **AI-powered financial companion** (using Gemini & Bankr) that actively manages your wealth and explains it to you in plain English. DeFi shouldn't be a dashboard of numbers; it should be a conversation.

## ✨ Core Features & Functionality

AutoYield combines advanced automation with a simple, conversational UI:

### 1. Gasless Daily Automation (The "Set & Forget" Engine)
Most "auto-compounders" still require you to make the initial deposit. AutoYield is different.
*   **Feature**: Users sign a single "Permit" (EIP-2612) that authorizes us to pull a specific amount (e.g., 10 USDC) per day.
*   **Functionality**: Our **Relayer Backend** wakes up every night at 12:00 UTC, checks every active subscription, and executes the deposits in a gas-efficient batch. The user pays **zero gas fees** for these daily transactions.

### 2. Conversational AI Dashboard
We replaced the complex "Analytics Page" with an **AI Agent** powered by **Google Gemini 3 Flash**.
*   **Feature**: A context-aware chatbot that lives in the app.
*   **Functionality**: Instead of searching for "APY History," a user simply asks, *"Did I make money today?"* The AI checks the blockchain state, calculates the user's specific performance, and answers: *"Yes! You earned $2.45 today, bringing your total to $1,050."*

### 3. Farcaster Native Integration (Frame v2)
We didn't build a website; we built a **Frame**.
*   **Feature**: The entire app runs inside the Farcaster mobile feed.
*   **Functionality**: This reduces friction to near zero. A user doesn't need to "connect wallet" or "switch networks"—they are already authenticated by their social profile.

### 4. Smart Yield Routing (In Progress)
We are integrating **AvantisFi** as our primary yield source (Perp LP), but the vision includes dynamic routing.
*   **Functionality**: Future updates will allow our AI to act as a portfolio manager, automatically moving user funds between Aave, Moonwell, and Avantis depending on who offers the best risk-adjusted APY that day.
