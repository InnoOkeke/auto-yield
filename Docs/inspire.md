# Meluri AutoYield - Project Story

## 💡 Inspiration
We've all been there: you put some money into a DeFi protocol, promising yourself you'll check it every day and compound your earnings. Two weeks later? You realize you completely forgot, and even if you *did* remember, the gas fees to claim $5 worth of rewards would cost you $2. It felt like DeFi was only built for whales who could afford to manage it constantly.

We wanted to fix that. We wanted a savings account that felt like magic—where you just say "save $10 a day," and it actually happens. No daily logins, no gas fees eating your lunch, just pure, automated growth.

## 🤖 What it does
Meluri AutoYield is a "set it and forget it" savings app that lives right inside Farcaster.
1.  **Automated Savings**: You connect your wallet once, sign a gasless permit, and tell us how much to save daily (e.g., 10 USDC).
2.  **Daily Execution**: Every night while you sleep, our backend wakes up, takes that 10 USDC, and deposits it into a high-yield strategy on the Base network (via AvantisFi).
3.  **Human-Readable AI**: We built in a smart AI assistant (powered by Gemini) that knows everything about the protocol. Instead of reading a 50-page whitepaper, you just ask it, *"How much money did I make?"* or *"Is this safe?"* and it explains it to you like a friend.

## 🛠️ How we built it
We split the app into two robust parts to make it fast and secure:
*   **The Frontend (Vercel)**: Built with **Next.js 14** and **Farcaster Frames v2**. This gives us that slick, native feel inside the mobile app.
*   **The Brain (Render)**: A **Node.js** backend that runs the Cron jobs. This is the "Relayer" that pays the gas fees for everyone.
*   **The Intelligence**: We integrated **Google Gemini 3 Flash** for the chatbot. We used a clever "Secure Proxy" pattern so the frontend can talk to the AI without ever exposing our secret API keys to the browser.
*   **The Chain**: We deployed on **Base** because the fees are low enough to make daily micro-savings actually viable.

## 🧩 Challenges we ran into
The biggest headache was **Security vs. Convenience**. We wanted users to never pay gas, which meant using EIP-2612 signatures. Debugging those cryptographic signatures across different mobile wallets was... a character-building experience.

Another hurdle was the **AI Integration**. At first, the bot would hallucinate and say we offered 1000% APY (scary!). We had to fine-tune the system prompts and give it strict context about our actual data sources to keep it honest and helpful.

## 🏆 Accomplishments that we're proud of
*   **True Automation**: Seeing that first cron job run at midnight and successfully move funds without us touching a button was a massive "It's alive!" moment.
*   **The Conversational UI**: The chat widget actually feels helpful, not annoying. It makes DeFi feel way less intimidating for new users.
*   **Gasless UX**: We managed to abstract away almost all the crypto complexity. To the user, it just feels like a regular fintech app.

## 🧠 What we learned
*   **Frames v2 is powerful**: It's not just for simple buttons anymore; you can build full-blown dApps that feel native.
*   **AI needs boundaries**: Generative AI in fintech is powerful but needs strict guardrails to avoid giving bad financial advice.
*   **Cron jobs are the unsung heroes**: Reliable automation is the backbone of "passive" income.

## 🚀 What's next for Meluri AutoYield
*   **Smart Portfolio**: Instead of just AvantisFi, we want the AI to automatically route funds to whichever protocol on Base has the highest yield that day.
*   **Notifications**: Using Farcaster notifications to ping you: *"Hey, you just earned $5 today!"*
*   **Fiat On-Ramp**: Allowing users to deposit directly from a debit card so they don't even need to buy USDC on an exchange first.