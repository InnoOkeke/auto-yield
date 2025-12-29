# AutoYield Farcaster Frame

Next.js frontend for AutoYield Farcaster Frame v2 mini-app.

## Features

- 🎨 Modern UI with Tailwind CSS + Framer Motion animations
- 🔗 Base network integration via Wagmi
- 💳 Wallet connection (Coinbase Wallet, Base Wallet)
- 📊 Real-time yield tracking
- 🔄 Automated subscription management
- 📱 Mobile-first responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```bash
cp .env.local.example .env.local
# Edit with your values
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home/Hero page
│   ├── onboard/page.tsx      # Onboarding flow
│   ├── dashboard/page.tsx    # User dashboard
│   └── api/og/route.tsx      # OG image generation
├── components/
│   ├── Hero.tsx              # Hero section
│   ├── FeatureSection.tsx    # Feature cards
│   ├── ConnectWallet.tsx     # Wallet connection
│   ├── SubscriptionForm.tsx  # Amount selection
│   ├── YieldStats.tsx        # Stats display
│   ├── ActivityFeed.tsx      # Transaction list
│   └── QuickActions.tsx      # Action menu
└── providers.tsx             # Wagmi + React Query
```

## Build for Production

```bash
npm run build
npm start
```

## Deploy

Deploy to Vercel:
```bash
vercel
```

Or any Next.js compatible platform.

## Environment Variables

See `.env.local.example` for required variables.
