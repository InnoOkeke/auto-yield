import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * Bankr Bot API Integration
 * 
 * Bankr is an AI-powered crypto agent that handles:
 * - Token swaps (using 0x for routing)
 * - Natural language transaction generation
 * - Multi-chain support (Base, Ethereum, Polygon, Solana)
 */

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';
const BANKR_API_KEY = process.env.BANKR_API_KEY;

/**
 * POST /api/bankr/swap
 * Generate a swap transaction from natural language
 * 
 * Request body:
 * - prompt: string (e.g., "Swap 0.1 ETH to USDC")
 * - userAddress: string (wallet address to execute the swap from)
 * - chain: string (optional, defaults to 'base')
 * 
 * Response:
 * - transaction object ready for signing
 */
router.post('/swap', async (req, res) => {
    try {
        const { prompt, userAddress, chain = 'base' } = req.body;

        // Validate required fields
        if (!prompt || !userAddress) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['prompt', 'userAddress']
            });
        }

        // Validate API key is configured
        if (!BANKR_API_KEY) {
            console.error('❌ BANKR_API_KEY not configured');
            return res.status(500).json({
                error: 'Bankr API not configured',
                message: 'Server configuration missing: BANKR_API_KEY not set. Please check backend logs.'
            });
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
            return res.status(400).json({
                error: 'Invalid wallet address format'
            });
        }

        console.log(`🔄 Bankr Swap Request: "${prompt}" for ${userAddress} on ${chain}`);

        // Call Bankr API to generate transaction
        const response = await axios.post(
            `${BANKR_API_URL}/v1/transactions/generate`,
            {
                prompt,
                sender: userAddress,
                chain,
                type: 'swap'
            },
            {
                headers: {
                    'Authorization': `Bearer ${BANKR_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        console.log('✅ Bankr transaction generated successfully');

        // Return the transaction for the frontend to sign
        res.json({
            success: true,
            transaction: response.data.transaction,
            metadata: {
                prompt,
                chain,
                estimatedGas: response.data.estimatedGas,
                route: response.data.route // Swap path info from 0x
            }
        });

    } catch (error) {
        console.error('❌ Bankr swap error:', error.message);

        // Handle specific error cases
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('❌ BatchNorm API Error Response:', JSON.stringify(error.response.data, null, 2));
                // Bankr API returned an error
                return res.status(error.response.status).json({
                    error: 'Bankr API error',
                    message: error.response.data?.message || error.response.data?.error || 'Failed to generate swap transaction',
                    details: error.response.data
                });
            } else if (error.code === 'ECONNABORTED') {
                return res.status(504).json({
                    error: 'Bankr API timeout',
                    message: 'The request took too long. Please try again.'
                });
            }
        }

        res.status(500).json({
            error: 'Failed to generate swap transaction',
            message: error.message
        });
    }
});

/**
 * POST /api/bankr/quote
 * Get a swap quote without generating a transaction
 * Useful for showing estimated amounts before swapping
 */
router.post('/quote', async (req, res) => {
    try {
        const { fromToken, toToken, amount, chain = 'base' } = req.body;

        if (!fromToken || !toToken || !amount) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['fromToken', 'toToken', 'amount']
            });
        }

        if (!BANKR_API_KEY) {
            return res.status(500).json({
                error: 'Bankr API not configured'
            });
        }

        const response = await axios.post(
            `${BANKR_API_URL}/v1/quotes/swap`,
            { fromToken, toToken, amount, chain },
            {
                headers: {
                    'Authorization': `Bearer ${BANKR_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        res.json({
            success: true,
            quote: response.data
        });

    } catch (error) {
        console.error('❌ Bankr quote error:', error.message);
        res.status(500).json({
            error: 'Failed to get swap quote',
            message: error.message
        });
    }
});

/**
 * GET /api/bankr/tokens
 * Get list of supported tokens for swapping
 */
router.get('/tokens', async (req, res) => {
    try {
        const { chain = 'base' } = req.query;

        // Popular tokens on Base that are commonly swapped
        const popularTokens = [
            { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
            { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
            { symbol: 'DEGEN', name: 'Degen', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' },
            { symbol: 'HIGHER', name: 'Higher', address: '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe' },
            { symbol: 'TOSHI', name: 'Toshi', address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4' },
            { symbol: 'BRETT', name: 'Brett', address: '0x532f27101965dd16442E59d40670FaF5eBB142E4' },
        ];

        res.json({
            chain,
            tokens: popularTokens
        });

    } catch (error) {
        console.error('❌ Bankr tokens error:', error.message);
        res.status(500).json({
            error: 'Failed to get tokens',
            message: error.message
        });
    }
});

export default router;
