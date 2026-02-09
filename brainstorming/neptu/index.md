# Neptu Token Implementation Progress

## Overview

This document tracks the implementation of the $NEPTU token and payment system for the Neptu hackathon project.

---

## Token Overview

| Property         | Value                                   |
| ---------------- | --------------------------------------- |
| **Token Name**   | Neptu                                   |
| **Symbol**       | NEPTU                                   |
| **Total Supply** | 1,000,000,000 (1 Billion)               |
| **Decimals**     | 6                                       |
| **Network**      | Solana (SPL Token)                      |
| **Model**        | Reward-Only (No Treasury Sales)         |
| **Fee Model**    | User pays all fees (zero platform cost) |

---

## Core Principles

### 1. Reward-Only Model

```
┌─────────────────────────────────────────────────────────────────┐
│  HOW NEPTU ENTERS CIRCULATION:                                  │
│  ✅ ONLY through rewards (pay SOL → get NEPTU)                  │
│  ✅ ONLY through gamification (streaks, referrals, etc.)        │
│  ❌ Treasury NEVER sells NEPTU                                  │
│  ❌ No IDO / Public Sale                                        │
│                                                                 │
│  AFTER USER EARNS NEPTU:                                        │
│  ✅ Can transfer to other users (P2P)                           │
│  ✅ Can trade on DEX (user-created pools)                       │
│  ✅ Can use to pay for readings (50% burned)                    │
│  ✅ Can hold/save for later                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Zero Platform Cost Fee Model

```
┌─────────────────────────────────────────────────────────────────┐
│  FEE RESPONSIBILITY:                                            │
│                                                                 │
│  Platform Owner:  $0 (no operational blockchain costs)          │
│  User:            Pays ALL Solana transaction fees              │
│                                                                 │
│  TWO REWARD TYPES:                                              │
│                                                                 │
│  IMMEDIATE (Payment Rewards)                                    │
│  ───────────────────────────                                    │
│  Pay SOL → Get NEPTU (same tx, user pays fee)                   │
│                                                                 │
│  ACCUMULATE + CLAIM (Gamification Rewards)                      │
│  ─────────────────────────────────────────                      │
│  Earn rewards → Track in database → User claims when ready      │
│  User signs claim tx → User pays fee → Receives NEPTU           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Token Allocation

| Category                | %   | Tokens      | Purpose                                  |
| ----------------------- | --- | ----------- | ---------------------------------------- |
| **Ecosystem & Rewards** | 55% | 550,000,000 | Payment rewards, gamification, referrals |
| **Treasury (DAO)**      | 25% | 250,000,000 | Partnerships, grants, ecosystem growth   |
| **Team & Advisors**     | 15% | 150,000,000 | Core team (4yr vest, 1yr cliff)          |
| **Reserve**             | 5%  | 50,000,000  | Emergency, unforeseen needs              |

### Ecosystem Pool Breakdown

| Source           | %   | Tokens      | Purpose                      |
| ---------------- | --- | ----------- | ---------------------------- |
| Payment Rewards  | 60% | 330,000,000 | SOL → NEPTU rewards          |
| Gamification     | 25% | 137,500,000 | Streaks, achievements        |
| Referral Program | 10% | 55,000,000  | Viral growth                 |
| Special Events   | 5%  | 27,500,000  | Campaigns, Balinese holidays |

---

## How to Earn NEPTU

### 1. Payment Rewards (Immediate - User Pays Fee)

| Reading Type  | SOL Price | NEPTU Reward | Fee Paid By |
| ------------- | --------- | ------------ | ----------- |
| POTENSI       | 0.01 SOL  | +10 NEPTU    | User        |
| PELUANG       | 0.001 SOL | +1 NEPTU     | User        |
| AI_CHAT       | 0.002 SOL | +2 NEPTU     | User        |
| COMPATIBILITY | 0.005 SOL | +5 NEPTU     | User        |

### 2. Gamification Rewards (Accumulate + Claim)

| Reward Type    | Action                      | NEPTU Reward  | Transfer   |
| -------------- | --------------------------- | ------------- | ---------- |
| Daily Check-in | View daily Peluang          | 0.1 NEPTU     | Accumulate |
| 7-Day Streak   | 7 consecutive check-ins     | 1 NEPTU       | Accumulate |
| 30-Day Streak  | 30 consecutive check-ins    | 5 NEPTU       | Accumulate |
| 100-Day Streak | 100 consecutive check-ins   | 20 NEPTU      | Accumulate |
| First Reading  | Complete first paid reading | 5 NEPTU       | Accumulate |
| Referral       | Friend signs up & pays      | 10 NEPTU      | Accumulate |
| Referee Bonus  | Sign up via referral        | 2 NEPTU       | Accumulate |
| Social Share   | Share reading on social     | 0.5 NEPTU     | Accumulate |
| Auspicious Day | Use on Kajeng Kliwon        | 2x multiplier | Accumulate |

**Claim Flow:** User accumulates rewards → Clicks "Claim" → Signs tx → Pays fee → Receives NEPTU

---

## How to Use NEPTU

### Pay with NEPTU (50% Burned - User Pays Fee)

| Reading Type  | NEPTU Price | Burned | To Ecosystem | Fee Paid By |
| ------------- | ----------- | ------ | ------------ | ----------- |
| POTENSI       | 10 NEPTU    | 5 🔥   | 5 recycled   | User        |
| PELUANG       | 1 NEPTU     | 0.5 🔥 | 0.5 recycled | User        |
| AI_CHAT       | 2 NEPTU     | 1 🔥   | 1 recycled   | User        |
| COMPATIBILITY | 5 NEPTU     | 2.5 🔥 | 2.5 recycled | User        |

---

## Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEPTU ECONOMY                           │
│                                                                 │
│  IMMEDIATE (User pays fee)          ACCUMULATE + CLAIM          │
│  ─────────────────────────          ─────────────────           │
│                                                                 │
│  Pay SOL for reading                Gamification rewards        │
│       │                                   │                     │
│       ▼                                   ▼                     │
│  ┌─────────────┐                  ┌─────────────────┐           │
│  │ 1 Transaction│                  │ Database tracks │           │
│  │ User signs   │                  │ unclaimed NEPTU │           │
│  │ User pays fee│                  └────────┬────────┘           │
│  └─────────────┘                           │                    │
│       │                             User clicks CLAIM           │
│       ▼                                   │                     │
│  SOL → Treasury                           ▼                     │
│  NEPTU → User                     ┌─────────────┐               │
│                                   │ 1 Transaction│               │
│                                   │ User signs   │               │
│                                   │ User pays fee│               │
│                                   └─────────────┘               │
│                                          │                      │
│                                          ▼                      │
│                                   NEPTU → User                  │
│                                                                 │
│  Platform cost: $0                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Packages Implemented

### packages/solana - Solana Integration

- [client.ts](../../packages/solana/src/client.ts) - RPC client
- [constants.ts](../../packages/solana/src/constants.ts) - Addresses, conversions
- [verification.ts](../../packages/solana/src/verification.ts) - TX verification
- [token/balance.ts](../../packages/solana/src/token/balance.ts) - Balance queries
- [token/reward.ts](../../packages/solana/src/token/reward.ts) - Reward calculations
- [programs/index.ts](../../packages/solana/src/programs/index.ts) - NEPTU program SDK (pure @solana/kit)

**Tests:** 17 passing

### packages/drizzle-orm - Database Layer

- `schemas/token-transactions.ts` - Transaction tracking
- `dto/token-transaction-dto.ts` - Data transfer objects
- `validators/token-transaction-validator.ts` - Input validation
- `repositories/token-transaction-repository.ts` - Data access
- `services/token-transaction-service.ts` - Business logic

**Tests:** 34 passing (bun-sqlite test helper for in-memory D1 compat)

### apps/api - API Routes

| Method | Path                              | Description             |
| ------ | --------------------------------- | ----------------------- |
| POST   | `/api/token/verify-payment`       | Verify on-chain payment |
| GET    | `/api/token/transactions/:wallet` | Transaction history     |
| GET    | `/api/token/stats/:wallet`        | Token stats             |
| GET    | `/api/token/price/:readingType`   | Get prices              |
| POST   | `/api/pay/sol/build`              | Build SOL payment tx    |
| POST   | `/api/pay/neptu/build`            | Build NEPTU payment tx  |
| POST   | `/api/pay/verify`                 | Verify payment tx       |
| POST   | `/api/pay/claim/build`            | Build claim rewards tx  |
| GET    | `/api/pay/pricing`                | Get all reading prices  |
| GET    | `/api/pay/pricing/:readingType`   | Get specific price      |

---

## Smart Contract Addresses

> ✅ **DEVNET** - Deployed and upgradeable

| Contract          | Address                                        | Status      |
| ----------------- | ---------------------------------------------- | ----------- |
| neptu_token       | `7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW` | ✅ Deployed |
| neptu_economy     | `6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT` | ✅ Deployed |
| Ecosystem Pool    | Set via `NEPTU_ECOSYSTEM_POOL` env var         | ⚙️ Config   |
| Treasury (SOL)    | Set via `NEPTU_TREASURY` env var               | ⚙️ Config   |
| Upgrade Authority | `2VNKqH3aL3xQkZGZ7wj3F6GWZ5E6VSovs3svLesaxwCo` | ✅ Set      |

---

## Next Steps

### Phase 4: AI Oracle ✅ DONE

- [x] Azure OpenAI gpt-4o-mini integration (apps/worker)
- [x] NeptuOracle class with Potensi+Peluang context injection
- [x] Oracle Sheet chat UI with interest-based personalization

### Wallet Page ✅ DONE

- [x] Token balance, streak, unclaimed rewards display
- [x] Transaction history component with Solana explorer links
- [x] Token stats card (SOL spent, NEPTU earned/burned, tx count)

### Onboarding ✅ REMOVED

- [x] Removed `/onboarding` route — users set profile in `/settings`

### Remaining

- [x] Compatibility page — Mitra Satru between two birth dates
- [ ] Payment toggle component (SOL/NEPTU) integration in reading pages
- [ ] Transaction signing flow end-to-end

---

## Codebase Compatibility Fixes (Feb 9)

| Priority | Issue                                           | Status                                                   |
| -------- | ----------------------------------------------- | -------------------------------------------------------- |
| High     | Wrangler 3 vs 4 mismatch (worker had `^3.99.0`) | ✅ Fixed — removed worker devDep, uses root `wrangler@4` |
| High     | Unused `@solana/spl-token` in web               | ✅ Fixed — removed (no source imports)                   |
| Medium   | `@cloudflare/workers-types` version drift       | ✅ Fixed — aligned to `^4.20250214.0`                    |
| Medium   | Zod version floor divergence in web             | ✅ Fixed — unified to `^3.25.56`                         |
| Medium   | Compatibility feature (Mitra Satru)             | ✅ Done — full calculator, API, UI, tests                |
| Low      | Stale `compatibility_date` in wrangler configs  | ✅ Fixed — updated to `2025-12-01`                       |
| Low      | Docker Compose deprecated `version: "3"` key    | ✅ Fixed — removed                                       |
