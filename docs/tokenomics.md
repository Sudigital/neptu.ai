# $NEPTU Tokenomics

> **"Pay with SOL → Earn NEPTU → Use NEPTU"**

## Token Overview

| Property         | Value                           |
| ---------------- | ------------------------------- |
| **Name**         | Neptu                           |
| **Symbol**       | NEPTU                           |
| **Network**      | Solana                          |
| **Standard**     | SPL Token                       |
| **Decimals**     | 6                               |
| **Total Supply** | 1,000,000,000 (1 Billion)       |
| **Max Supply**   | Fixed (no minting after launch) |

## Token Distribution

| Allocation       | Amount      | Percentage | Purpose                      |
| ---------------- | ----------- | ---------- | ---------------------------- |
| **Rewards Pool** | 300,000,000 | 30%        | SOL payments → NEPTU rewards |
| **Treasury/DAO** | 250,000,000 | 25%        | Operations, governance       |
| **Liquidity**    | 200,000,000 | 20%        | Future DEX pool              |
| **Team**         | 150,000,000 | 15%        | Core contributors (vested)   |
| **Ecosystem**    | 100,000,000 | 10%        | Partnerships, grants         |

## Hybrid Payment Model

Our unique model doesn't require a liquidity pool at launch:

### Pay with SOL (New Users)

```
User pays 0.05 SOL → Treasury receives SOL
                  → User gets 50 NEPTU reward 🎁
```

### Pay with NEPTU (Returning Users)

```
User pays 50 NEPTU → 25 NEPTU BURNED 🔥
                  → 25 NEPTU to Treasury
```

## Pricing

### Subscription Plans

| Plan        | SOL Price | NEPTU Price | NEPTU Reward |
| ----------- | --------- | ----------- | ------------ |
| **Free**    | 0         | 0           | -            |
| **Weekly**  | 0.05 SOL  | 50 NEPTU    | +50 NEPTU    |
| **Monthly** | 0.15 SOL  | 150 NEPTU   | +150 NEPTU   |
| **Yearly**  | 1 SOL     | 1,000 NEPTU | +1,000 NEPTU |

### Pay-Per-Use

| Feature       | SOL       | NEPTU    | Reward |
| ------------- | --------- | -------- | ------ |
| Full Potensi  | 0.01 SOL  | 10 NEPTU | +10    |
| Daily Peluang | 0.001 SOL | 1 NEPTU  | +1     |
| AI Chat       | 0.002 SOL | 2 NEPTU  | +2     |
| Compatibility | 0.005 SOL | 5 NEPTU  | +5     |

## Deflationary Mechanism

Every NEPTU payment has **50% burned**:

- Reduces circulating supply over time
- Creates scarcity as adoption grows
- Rewards long-term holders

## Token Utility

| Use Case             | Status    |
| -------------------- | --------- |
| Subscription Payment | ✅ Live   |
| Pay-Per-Use Features | ✅ Live   |
| Governance Voting    | 🔜 Coming |
| Staking Rewards      | 🔜 Coming |
| Referral Bonus       | 🔜 Coming |

## Why This Model?

| Benefit                 | Explanation                   |
| ----------------------- | ----------------------------- |
| ✅ No LP needed         | SOL goes directly to treasury |
| ✅ Easy onboarding      | Pay with SOL you already have |
| ✅ Organic distribution | Earn NEPTU by using the app   |
| ✅ Deflationary         | 50% burn on NEPTU payments    |
| ✅ Real backing         | Treasury holds SOL            |

## Contract Addresses

::: warning Devnet Only
Neptu is currently on Solana Devnet. Mainnet launch coming soon!
:::

| Contract          | Network | Address                                        | Explorer                                                                                       |
| ----------------- | ------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Token Program** | Devnet  | `7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW` | [View](https://solscan.io/account/7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW?cluster=devnet) |
| **Economy**       | Devnet  | `6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT` | [View](https://solscan.io/account/6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT?cluster=devnet) |
| **Token Mint**    | Devnet  | PDA derived from Token Program (seed: `mint`)  | Derived at runtime                                                                             |

### Program Details

- **Token Program (`neptu_token`)**: Handles SPL token minting, metadata, and initial supply distribution
- **Economy Program (`neptu_economy`)**: Manages pricing, payments (SOL/NEPTU), and burn mechanics

### How to Test

```bash
# Set Solana CLI to devnet
solana config set --url devnet

# Check program deployment
solana program show 7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW
solana program show 6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT
```

## Roadmap

| Phase | Milestone              | Status      |
| ----- | ---------------------- | ----------- |
| 1     | Core MVP               | ✅ Complete |
| 2     | AI Oracle Integration  | ✅ Complete |
| 3     | Token on Devnet        | ✅ Complete |
| 4     | Multi-language (EN/ID) | ✅ Complete |
| 5     | Mainnet Launch         | 🔜 Coming   |
| 6     | DEX Listing            | 🔜 Coming   |
| 7     | Governance             | 🔮 Future   |
