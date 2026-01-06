import express from 'express';
import prisma from '../utils/database.js';
import avantisService from '../services/avantis.js';
import { getSSLHubRpcClient, Message } from '@farcaster/hub-nodejs';

const HUB_URL = process.env.FARCASTER_HUB_URL || 'hub-grpc-api.neynar.com';
const client = getSSLHubRpcClient(HUB_URL);

async function verifyFrameRequest(req) {
  if (process.env.SKIP_FRAME_VERIFY === 'true') return true;

  // Allow unverified requests in dev if no Hub is configured (fallback warning)
  if (process.env.NODE_ENV !== 'production' && !process.env.FARCASTER_HUB_URL) {
    console.warn('⚠️ Skipping verification in dev: No FARCASTER_HUB_URL');
    return true;
  }

  try {
    const { trustedData } = req.body;
    if (!trustedData?.messageBytes) return false;

    const frameMessage = Message.decode(Buffer.from(trustedData.messageBytes, 'hex'));
    const result = await client.validateMessage(frameMessage);

    return result.isOk() && result.value.valid;
  } catch (error) {
    console.error('Frame verification error:', error);
    return false;
  }
}

const router = express.Router();

/**
 * GET /frame
 * Initial Frame render - Onboarding screen
 */
router.get('/', async (req, res) => {
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AutoYield - Automated DeFi Savings</title>
  
  <!-- Farcaster Frame metadata -->
  <meta property="fc:frame" content="vNext">
  <meta property="fc:frame:image" content="${process.env.FRAME_BASE_URL}/images/hero.png">
  <meta property="fc:frame:button:1" content="Start Earning">
  <meta property="fc:frame:button:1:action" content="post">
  <meta property="fc:frame:button:1:target" content="${process.env.FRAME_BASE_URL}/frame/onboard">
  <meta property="fc:frame:button:2" content="My Dashboard">
  <meta property="fc:frame:button:2:action" content="post">
  <meta property="fc:frame:button:2:target" content="${process.env.FRAME_BASE_URL}/frame/dashboard">
  
  <!-- Open Graph metadata -->
  <meta property="og:title" content="AutoYield">
  <meta property="og:description" content="Automate your DeFi savings with daily USDC deductions earning yield on Base">
  <meta property="og:image" content="${process.env.FRAME_BASE_URL}/images/hero.png">
</head>
<body>
  <h1>AutoYield</h1>
  <p>Automated DeFi Savings on Base</p>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(frameHtml);
});

/**
 * POST /frame/onboard
 * Handle onboarding flow
 */
router.post('/onboard', async (req, res) => {
  try {
    const { untrustedData, trustedData } = req.body;

    // Security: Verify signature
    if (!(await verifyFrameRequest(req))) {
      return res.status(401).send('Invalid Frame Signature');
    }

    // In production, verify trustedData signature
    const fid = untrustedData?.fid;
    const buttonIndex = untrustedData?.buttonIndex;

    const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="fc:frame" content="vNext">
  <meta property="fc:frame:image" content="${process.env.FRAME_BASE_URL}/images/onboarding.png">
  <meta property="fc:frame:input:text" content="Daily amount (USDC)">
  <meta property="fc:frame:button:1" content="Subscribe $5/day">
  <meta property="fc:frame:button:1:action" content="post">
  <meta property="fc:frame:button:1:target" content="${process.env.FRAME_BASE_URL}/frame/subscribe?amount=5">
  <meta property="fc:frame:button:2" content="Subscribe $10/day">
  <meta property="fc:frame:button:2:action" content="post">
  <meta property="fc:frame:button:2:target" content="${process.env.FRAME_BASE_URL}/frame/subscribe?amount=10">
  <meta property="fc:frame:button:3" content="Custom Amount">
  <meta property="fc:frame:button:3:action" content="post">
  <meta property="fc:frame:button:3:target" content="${process.env.FRAME_BASE_URL}/frame/subscribe">
</head>
<body>
  <h1>Choose Your Daily Savings</h1>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(frameHtml);
  } catch (error) {
    console.error('Onboard error:', error);
    res.status(500).send('Error processing request');
  }
});

/**
 * POST /frame/subscribe
 * Handle subscription creation
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { untrustedData } = req.body;
    const { amount } = req.query;
    const inputAmount = untrustedData?.inputText;

    let dailyAmount = amount || inputAmount || '10';

    // Security: Validate dailyAmount is numeric to prevent XSS
    if (!/^\d+(\.\d+)?$/.test(dailyAmount)) {
      console.warn('Invalid dailyAmount received:', dailyAmount);
      dailyAmount = '10';
    }

    // Generate transaction for user to sign
    const txData = {
      chainId: `eip155:${process.env.CHAIN_ID}`,
      method: 'eth_sendTransaction',
      params: {
        abi: [{
          "inputs": [{ "type": "uint256", "name": "dailyAmount" }],
          "name": "subscribe",
          "type": "function"
        }],
        to: process.env.VAULT_ADDRESS,
        data: `subscribe(${ethers.parseUnits(dailyAmount, 6)})`,
      },
    };

    const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="fc:frame" content="vNext">
  <meta property="fc:frame:image" content="${process.env.FRAME_BASE_URL}/images/subscribe-confirm.png">
  <meta property="fc:frame:button:1" content="Confirm & Sign">
  <meta property="fc:frame:button:1:action" content="tx">
  <meta property="fc:frame:button:1:target" content="${process.env.FRAME_BASE_URL}/frame/tx-success">
  <meta property="fc:frame:button:1:post_url" content="${process.env.FRAME_BASE_URL}/frame/tx-data">
</head>
<body>
  <h1>Confirm Subscription</h1>
  <p>$${dailyAmount} USDC per day</p>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(frameHtml);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).send('Error processing subscription');
  }
});

/**
 * POST /frame/dashboard
 * Show user dashboard with stats
 */
router.post('/dashboard', async (req, res) => {
  try {
    const { untrustedData } = req.body;
    const fid = untrustedData?.fid;

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { farcasterFid: fid },
      include: { subscription: true },
    });

    let yieldData = null;
    if (user?.walletAddress) {
      yieldData = await avantisService.getUserYieldData(user.walletAddress);
    }

    const imageUrl = yieldData
      ? `${process.env.FRAME_BASE_URL}/images/dashboard?value=${yieldData.currentValue}&yield=${yieldData.yieldEarned}`
      : `${process.env.FRAME_BASE_URL}/images/dashboard-empty.png`;

    const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="fc:frame" content="vNext">
  <meta property="fc:frame:image" content="${imageUrl}">
  <meta property="fc:frame:button:1" content="Withdraw">
  <meta property="fc:frame:button:1:action" content="post">
  <meta property="fc:frame:button:1:target" content="${process.env.FRAME_BASE_URL}/frame/withdraw">
  <meta property="fc:frame:button:2" content="Unsubscribe">
  <meta property="fc:frame:button:2:action" content="post">
  <meta property="fc:frame:button:2:target" content="${process.env.FRAME_BASE_URL}/frame/unsubscribe">
  <meta property="fc:frame:button:3" content="Refresh">
  <meta property="fc:frame:button:3:action" content="post">
  <meta property="fc:frame:button:3:target" content="${process.env.FRAME_BASE_URL}/frame/dashboard">
</head>
<body>
  <h1>Your AutoYield Dashboard</h1>
  ${yieldData ? `
    <p>Current Value: $${yieldData.currentValue}</p>
    <p>Yield Earned: $${yieldData.yieldEarned}</p>
  ` : '<p>No active subscription</p>'}
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(frameHtml);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

/**
 * POST /frame/withdraw
 * Handle withdrawal request
 */
router.post('/withdraw', async (req, res) => {
  try {
    const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="fc:frame" content="vNext">
  <meta property="fc:frame:image" content="${process.env.FRAME_BASE_URL}/images/withdraw.png">
  <meta property="fc:frame:button:1" content="Withdraw All">
  <meta property="fc:frame:button:1:action" content="tx">
  <meta property="fc:frame:button:1:target" content="${process.env.FRAME_BASE_URL}/frame/tx-success">
  <meta property="fc:frame:button:2" content="Cancel">
  <meta property="fc:frame:button:2:action" content="post">
  <meta property="fc:frame:button:2:target" content="${process.env.FRAME_BASE_URL}/frame/dashboard">
</head>
<body>
  <h1>Withdraw Funds</h1>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(frameHtml);
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).send('Error processing withdrawal');
  }
});

export default router;
