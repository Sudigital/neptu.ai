# Neptu.ai

> 🌴 **Your Balinese Soul, On-Chain**

Neptu transforms the ancient 1000-year-old Balinese Wuku calendar into an AI-powered personal oracle on Solana. Users connect their wallet, enter their birth date, and receive **Potensi** (life potential) and daily **Peluang** (opportunity) readings based on the sacred 210-day Wuku cycle.

## ✨ Features

- **Potensi Reading** - Discover your innate characteristics based on birth date (CIPTA, RASA, KARSA)
- **Daily Peluang** - Get today's energy forecast and recommended actions
- **AI Oracle Chat** - Personalized guidance from the Neptu AI agent
- **Compatibility Check** - Mitra Satru matching with another person
- **$NEPTU Token** - Hybrid payment model with 50% burn (deflationary)

## 🏗️ Project Structure

```
neptu.ai/
├── apps/
│   ├── api/                    # Hono API server
│   ├── cli/                    # CLI tool
│   └── web/                    # React web application
├── packages/
│   ├── wariga-belog/           # Wuku calendar calculator engine
│   ├── shared/                 # Shared TypeScript types
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TypeScript config
├── blockchain/
│   └── solana/                 # Anchor programs (coming soon)
├── brainstorming/              # Planning & specs
└── docs/                       # Documentation (VitePress)
```

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run all (web + api + cli)
bun run dev

# Run web only
bun run --filter shadcn-admin dev

# Run API only
bun run --filter @neptu/api dev
```

## 💰 Hybrid Payment Model

**Pay with SOL → Earn NEPTU → Next time pay with NEPTU**

| Feature       | SOL Price | NEPTU Price | NEPTU Reward (if SOL) |
| ------------- | --------- | ----------- | --------------------- |
| Full Potensi  | 0.01 SOL  | 10 NEPTU    | +10 NEPTU 🎁          |
| Daily Peluang | 0.001 SOL | 1 NEPTU     | +1 NEPTU 🎁           |
| AI Chat       | 0.002 SOL | 2 NEPTU     | +2 NEPTU 🎁           |
| Compatibility | 0.005 SOL | 5 NEPTU     | +5 NEPTU 🎁           |

### Why Hybrid?

- ✅ **No liquidity pool needed** - SOL goes directly to treasury
- ✅ **Easy onboarding** - New users pay with SOL they already have
- ✅ **Incentive to hold** - Pay with NEPTU = save your SOL
- ✅ **Deflationary** - 50% of NEPTU payments burned 🔥

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + TailwindCSS + shadcn/ui
- **Blockchain**: Solana + Anchor
- **Wallet**: Privy (embedded + external wallets)
- **Build**: Bun + Turborepo
- **API**: Hono
- **Docs**: VitePress

## 📚 Documentation

- [NEPTU-SPEC.md](./brainstorming/neptu/NEPTU-SPEC.md) - Full technical specification
- [TOKENOMICS.md](./brainstorming/neptu/TOKENOMICS.md) - Token economics details
- [PLAN.md](./brainstorming/neptu/PLAN.md) - Implementation plan

## 🏷️ Tags

`ai` `consumer` `payments`

---

Built for **Colosseum Agent Hackathon 2026** 🏛️

_Om Swastiastu_ 🙏
