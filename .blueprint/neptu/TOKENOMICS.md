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

---

## Token Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN ALLOCATION                             │
│                                                                 │
│   ████████████████████████████░░░░░░░░░░  Rewards Pool   30%    │
│   █████████████████████████░░░░░░░░░░░░░  Treasury/DAO   25%    │
│   ████████████████████░░░░░░░░░░░░░░░░░░  Liquidity      20%    │
│   ███████████████░░░░░░░░░░░░░░░░░░░░░░░  Team           15%    │
│   ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Ecosystem      10%    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Allocation       | Amount      | Percentage | Vesting                   | Purpose                         |
| ---------------- | ----------- | ---------- | ------------------------- | ------------------------------- |
| **Rewards Pool** | 300,000,000 | 30%        | Unlocked                  | SOL payments → NEPTU rewards    |
| **Treasury/DAO** | 250,000,000 | 25%        | 2-year linear             | Operations, governance          |
| **Liquidity**    | 200,000,000 | 20%        | Unlocked (future)         | DEX pool when ready             |
| **Team**         | 150,000,000 | 15%        | 1-year cliff, 3-year vest | Core contributors               |
| **Ecosystem**    | 100,000,000 | 10%        | As needed                 | Partnerships, grants, marketing |

---

## Hybrid Payment Model

### The Innovation: No Liquidity Pool Required at Launch

Traditional model requires DEX liquidity for token purchases. Neptu's hybrid model:

1. **New users** → Pay with SOL → Receive NEPTU rewards
2. **Returning users** → Pay with earned NEPTU → 50% burned

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   NEW USER FLOW                                                 │
│   ─────────────                                                 │
│                                                                 │
│   👤 User ──► Pays 0.05 SOL ──► Treasury receives SOL           │
│                            └──► User gets 50 NEPTU 🎁           │
│                                 (from Rewards Pool)             │
│                                                                 │
│   RETURNING USER FLOW                                           │
│   ───────────────────                                           │
│                                                                 │
│   👤 User ──► Pays 50 NEPTU ──► 25 NEPTU BURNED 🔥              │
│                            └──► 25 NEPTU → Treasury             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing Structure

### Subscription Plans

| Plan        | SOL Price | NEPTU Price | NEPTU Reward | Features                   |
| ----------- | --------- | ----------- | ------------ | -------------------------- |
| **Free**    | 0         | 0           | -            | Raw Potensi data only      |
| **Weekly**  | 0.05 SOL  | 50 NEPTU    | +50 NEPTU    | Full features, 10 AI chats |
| **Monthly** | 0.15 SOL  | 150 NEPTU   | +150 NEPTU   | Full features, 50 AI chats |
| **Yearly**  | 1 SOL     | 1,000 NEPTU | +1,000 NEPTU | Unlimited everything       |

### Pay-Per-Use

| Feature              | SOL Price | NEPTU Price | NEPTU Reward |
| -------------------- | --------- | ----------- | ------------ |
| Full Potensi Reading | 0.01 SOL  | 10 NEPTU    | +10 NEPTU    |
| Daily Peluang        | 0.001 SOL | 1 NEPTU     | +1 NEPTU     |
| AI Oracle Chat       | 0.002 SOL | 2 NEPTU     | +2 NEPTU     |
| Compatibility Check  | 0.005 SOL | 5 NEPTU     | +5 NEPTU     |

---

## Deflationary Mechanism

### 50% Burn on NEPTU Payments

Every time a user pays with NEPTU:

- **50% is BURNED** → Permanent supply reduction
- **50% goes to Treasury** → Operations & DAO

```
Example: User pays 100 NEPTU for Monthly subscription

100 NEPTU paid
    │
    ├──► 50 NEPTU → BURNED 🔥 (gone forever)
    │
    └──► 50 NEPTU → Treasury

Circulating Supply: -50 NEPTU
```

### Burn Projections

| Scenario     | Monthly Users | Avg NEPTU/User | Monthly Burn | Yearly Burn |
| ------------ | ------------- | -------------- | ------------ | ----------- |
| Conservative | 1,000         | 50 NEPTU       | 25,000       | 300,000     |
| Moderate     | 10,000        | 75 NEPTU       | 375,000      | 4,500,000   |
| Optimistic   | 100,000       | 100 NEPTU      | 5,000,000    | 60,000,000  |

At **moderate adoption**, 4.5M NEPTU burned per year = **0.45% annual deflation**

---

## Token Utility

| Use Case                 | Description                         |
| ------------------------ | ----------------------------------- |
| **Subscription Payment** | Pay for weekly/monthly/yearly plans |
| **Pay-Per-Use**          | Unlock individual features          |
| **Governance**           | Vote on DAO proposals (future)      |
| **Staking**              | Stake for benefits (future)         |
| **Referral Rewards**     | Earn NEPTU for referrals (future)   |

---

## Treasury Management

### SOL Treasury

- Receives all SOL payments
- Used for:
  - Operational costs (hosting, AI API)
  - Marketing & partnerships
  - Team compensation
  - Future liquidity pool creation

### NEPTU Treasury

- Receives 50% of NEPTU payments
- Used for:
  - DAO governance rewards
  - Ecosystem grants
  - Strategic partnerships

---

## Vesting Schedules

### Team Tokens (150M)

```
Year 0 ─────────────────────────────► Year 1 (Cliff)
│                                     │
│  0% unlocked                        │ 0% unlocked
│                                     │
                                      ▼
Year 1 ─────────────────────────────► Year 4 (Fully Vested)
│                                     │
│  Linear unlock starts               │ 100% unlocked
│  ~4.17M/month                       │
```

### Treasury/DAO (250M)

```
Year 0 ─────────────────────────────► Year 2 (Fully Vested)
│                                     │
│  Linear unlock                      │ 100% unlocked
│  ~10.4M/month                       │
```

---

## Future: Liquidity Pool

When conditions are right (enough SOL in treasury, sufficient demand):

1. **Create Raydium/Orca Pool**
   - Pair: SOL/NEPTU
   - Initial liquidity from reserves (200M NEPTU + Treasury SOL)

2. **Enable Jupiter Swaps**
   - Users can buy NEPTU directly
   - Arbitrage keeps price stable

3. **LP Incentives**
   - Ecosystem fund for LP rewards
   - Sustainable yield from trading fees

---

## Token Value Drivers

| Driver                | Effect                         |
| --------------------- | ------------------------------ |
| 🔥 **Burn mechanism** | Reduces supply over time       |
| 💰 **SOL backing**    | Treasury holds real value      |
| 📈 **Utility demand** | More users = more NEPTU needed |
| 🔒 **Vesting**        | Reduced sell pressure          |
| 🏛️ **DAO governance** | Community-driven decisions     |

---

## Smart Contract Addresses

> ⚠️ **DEVNET** - Not yet deployed

| Contract         | Address | Status  |
| ---------------- | ------- | ------- |
| Token Mint       | TBD     | Pending |
| Rewards Pool     | TBD     | Pending |
| Treasury (SOL)   | TBD     | Pending |
| Treasury (NEPTU) | TBD     | Pending |
| Payment Program  | TBD     | Pending |

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     $NEPTU TOKENOMICS                           │
│                                                                 │
│   Total Supply:     1,000,000,000 NEPTU                         │
│   Decimals:         6                                           │
│   Network:          Solana                                      │
│                                                                 │
│   🔥 Deflationary:  50% of NEPTU payments burned                │
│   💰 Backed:        Treasury holds SOL from payments            │
│   🎁 Rewards:       Earn NEPTU when paying with SOL             │
│   🏛️ Governance:    DAO voting (future)                         │
│                                                                 │
│   No liquidity pool required at launch!                         │
│   Users earn NEPTU organically through usage.                   │
└─────────────────────────────────────────────────────────────────┘
```
