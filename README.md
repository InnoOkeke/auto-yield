# AutoYield - Automated DeFi Savings on Base

A Farcaster Frame v2 mini-app that enables automated daily USDC deductions from user wallets, pooling funds, and deployed them into AvantisFi yield strategies.

## 🌟 Features

- **Gasless Subscriptions**: Users subscribe via EIP-2612 permits.
- **Automated Daily Deductions**: Backend relayer executes daily USDC deductions at midnight UTC.
- **Direct AvantisFi Integration**: Immediate deposit into AvantisFi LP Vault (avUSDC).
- **🤖 AI Support Chatbot**: Instant help powered by **Google Gemini** to answer questions about yield, fees, and troubleshooting.
- **Farcaster Frame UI**: Full-screen user experience within Farcaster.
- **🛡️ Secure Architecture**: 
    - **API Proxy Pattern**: Hides sensitive keys from the client browser.
    - **Frame Verification**: Cryptographic signature validation for all Frame interactions.
    - **API Authentication**: Service-to-service auth using shared secrets.

## 🏗️ Architecture

The application is split into two deployments:

### 1. Frontend (Vercel)
- **Framework**: Next.js 14 (App Router)
- **Role**: Renders the Farcaster Frame, Dashboard, and Chat Widget.
- **Security**: Uses a server-side API Proxy (`/api/proxy/*`) to talk to the backend, ensuring `API_SECRET` is never exposed.

### 2. Backend (Render)
- **Framework**: Node.js / Express
- **Role**: 
    - Manages the database (PostgreSQL).
    - Runs Cron Jobs for daily deduction.
    - Talks to the Blockchain (Operator Wallet).
    - Talks to Gemini AI API.
- **Security**: Protected by `x-api-key` and Frame Signature verification.

## 🚀 Deployment Guide

### 1. Backend Setup (Render)
Deploy the `backend` folder as a **Web Service**.

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `VAULT_ADDRESS` | AutoYield Vault Contract Address |
| `OPERATOR_PRIVATE_KEY` | Private key of the wallet paying for gas (Cron Job) |
| `BASE_RPC_URL` | Base Network RPC URL |
| `FRAME_BASE_URL` | URL of your deployed Frontend (e.g., `https://autoyield.vercel.app`) |
| `API_SECRET` | Strong random string (shared with frontend) |
| `GEMINI_API_KEY` | Google AI Studio Key for Chatbot |
| `FARCASTER_HUB_URL` | (Optional) Private Hub URL, defaults to public Neynar Hub |

### 2. Frontend Setup (Vercel)
Deploy the `frame` folder as a **Next.js Project**.

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `API_SECRET` | **Must match** the Backend `API_SECRET` |
| `NEXT_PUBLIC_API_URL` | URL of your deployed Backend (e.g., `https://autoyield.onrender.com`) |
| `NEXT_PUBLIC_FRAME_URL` | URL of this Frontend (e.g., `https://autoyield.vercel.app`) |
| `NEXT_PUBLIC_VAULT_ADDRESS` | AutoYield Vault Contract Address |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC Contract Address |
| `NEXT_PUBLIC_BASE_RPC_URL` | Base Network RPC URL |
| `NEXT_PUBLIC_CHAIN_ID` | `8453` (Base Mainnet) or `84532` (Sepolia) |

## 🧠 AI Chatbot
The app features a floating chat widget that helps users.
- **Frontend**: `ChatWidget.tsx` handles the UI and history.
- **Proxy**: `/api/proxy/chat` forwards the request securely.
- **Backend**: `/api/chat` constructs a system prompt with AutoYield documentation and calls Gemini.

## 🔄 Cron Jobs (Automation)
The backend runs automated tasks to keep the protocol running:

| Job | Schedule | Description |
|-----|----------|-------------|
| **Daily Deductions** | `0 0 * * *` | Checks active subscriptions and executes deposits. |
| **Relayer Check** | `0 */6 * * *` | Alerts if Operator wallet is low on ETH. |
| **Yield Snapshot** | `0 */4 * * *` | Records performance metrics. |

## 🧪 Testing

### Run Backend Locally
```bash
cd backend
npm install
# Set .env variables...
npm run dev
```

### Run Frontend Locally
```bash
cd frame
npm install
# Set .env.local variables...
npm run dev
```

## 📜 License
MIT License
