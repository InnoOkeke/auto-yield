# AutoYield Business Documentation

## 🎤 Elevator Pitch
"You know how everyone talks about earning high yields in crypto, but actually doing it is a huge pain? You have to log in constantly, pay gas fees every time, and remember to compound your earnings. Honestly, most people just give up.

**That’s exactly why we built AutoYield.**

Think of it as a 'set it and forget it' savings account that lives right inside your social feed on Farcaster. You sign up once—literally just one click, zero gas fees—and our system takes over. Every night while you're sleeping, it automatically moves a daily amount of your USDC into a high-yield strategy on Base.

We handle all the complex stuff and pay the gas fees for you. You just wake up richer than you went to sleep.

And we just added this really cool AI assistant to it. So instead of searching through confusing docs, you can just ask it, *'Hey, how much did I make yesterday?'* or *'Is my money safe?'* and it gives you a straight answer instantly. It’s basically the easiest way to grow your savings without thinking about it."

---

## 🏷️ Tagline
**"Set it. Forget it. Grow it."**

---

## 🛠️ Tools & Technologies Used
We leveraged a modern, scalable stack to build AutoYield:

### Blockchain & DeFi
- **Base Network**: L2 blockchain for low-cost, fast settlement.
- **AvantisFi**: The underlying yield protocol (Perpetual DEX LP).
- **USDC**: Stablecoin for savings.
- **EIP-2612 Permits**: For gasless user approvals.

### Frontend
- **Farcaster Frames v2**: The interactive mini-app runtime.
- **Next.js 14**: React framework for the Frame and Dashboard.
- **TailwindCSS**: Styling and UI design.
- **Wagmi / Viem**: Ethereum hooks for wallet connection.
- **Vercel**: Frontend hosting and serverless functions (secure proxy).

### Backend
- **Node.js & Express**: API server and relay logic.
- **Prisma**: ORM for PostgreSQL database management.
- **PostgreSQL**: Stores user subscriptions, transaction history, and yield data.
- **Cron**: Handles automated nightly deduction scheduling.
- **Render**: Backend hosting and background workers.

### AI & Automation
- **Google Gemini (v3 Flash)**: Powers the conversational AI chatbot.
- **Relayer**: Custom server-side wallet that pays gas fees for users.

### Security
- **Secure API Proxy**: Hides API keys from the client.
- **Signature Verification**: Validates all Farcaster Frame requests.