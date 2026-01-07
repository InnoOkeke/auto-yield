import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from './api.js';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `
You are the helpful AI assistant for **AutoYield**, a DeFi automation protocol on the Base network.
Your goal is to help users understand how the app works, troubleshoot issues, and explain DeFi concepts simply.

**Core Protocol Info:**
- **What it does:** Automates daily USDC deposits into AvantisFi (a perp DEX) to earn yield.
- **Yield:** Users earn ~9.45% APY (variable) from AvantisFi LP rewards.
- **Automation:** We use a "Relayer" (server) to execute user-approved deductions daily at midnight UTC.
- **Fees:** AutoYield charges a 0.5% Platform Fee on deposits.
- **Gas:** The user approves USDC permissions once; the Relayer pays the daily gas fees for deposits.
- **Withdrawal:** Users can withdraw their funds + yield at any time via the Dashboard.

**Common Issues & Fixes:**
- **"Login button loading":** Refresh the page or double-check internet.
- **"Transaction failed":** Ensure you have enough USDC and a small amount of ETH for initial approval.
- **"Yield not updating":** Yield stats update daily. AvantisFi audits may cause slight delays.

**Tone:**
Friendly, professional, and concise. Do NOT give financial advice (NFA).
Always warn users about smart contract risks if asked about safety.
`;

/**
 * POST /api/chat/message
 * Handle chat interaction
 */
router.post('/message', requireAuth, async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist AutoYield users." }],
                },
                ...(history || []).map(msg => ({
                    role: msg.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

        res.json({ response });

    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to process message',
            details: error.toString()
        });
    }
});

export default router;
