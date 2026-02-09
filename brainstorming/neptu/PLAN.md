# 🌴 Neptu Implementation Plan

> **Hackathon Deadline:** Feb 12, 2026 (~8 days left)
> **Status:** Phase 3 in progress

---

## Phase Overview

| Phase | Name            | Status         | Days |
| ----- | --------------- | -------------- | ---- |
| 1     | Core Calculator | ✅ DONE        | -    |
| 2     | Frontend UI     | 🔄 IN PROGRESS | 2-3  |
| 3     | Token & Payment | ✅ DONE        | 2    |
| 4     | AI Agent        | ✅ DONE        | 2    |
| 5     | Polish & Deploy | 🔄 IN PROGRESS | 2    |

---

## Token Model Summary (Updated Feb 4)

### Core Principles

1. **Reward-Only Model** - NEPTU only enters circulation through rewards
2. **Zero Platform Cost** - Users pay ALL transaction fees
3. **P2P Trading Allowed** - Users can transfer/trade earned NEPTU
4. **50% Burn on Use** - Deflationary when paying with NEPTU

### Fee Model

| Action               | Transfer            | Fee Paid By |
| -------------------- | ------------------- | ----------- |
| Pay SOL for reading  | Immediate           | User        |
| Receive NEPTU reward | Immediate (same tx) | User        |
| Gamification reward  | Accumulate in DB    | -           |
| Claim rewards        | User-initiated      | User        |
| Pay with NEPTU       | Immediate           | User        |

**Platform operational cost: $0**

### Token Allocation

| Category                | %   | Tokens      | Purpose                       |
| ----------------------- | --- | ----------- | ----------------------------- |
| **Ecosystem & Rewards** | 55% | 550,000,000 | Payment rewards, gamification |
| **Treasury (DAO)**      | 25% | 250,000,000 | Partnerships, grants          |
| **Team & Advisors**     | 15% | 150,000,000 | Core team (vested)            |
| **Reserve**             | 5%  | 50,000,000  | Emergency                     |

---

```
solana program show 7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW

Program Id: 7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: F1mMCK5j3nqyeBpDjyV2Td22EbN2HM7nnbDbV61SY7ry
Authority: 2VNKqH3aL3xQkZGZ7wj3F6GWZ5E6VSovs3svLesaxwCo
Last Deployed In Slot: 439776352
Data Length: 320448 (0x4e3c0) bytes
Balance: 2.23152216 SOL
```

## Phase 1: Core Calculator ✅ DONE

- [x] Port Python calculator to TypeScript (wariga-belog)
- [x] Create Neptu database
- [x] Build calculator class with all cycles
- [x] Unit tests (12 tests passing)
- [x] Turborepo monorepo setup

---

## Phase 2: Frontend UI 🔄 IN PROGRESS

### 2.1 Authentication (Privy)

- [x] Install @privy-io/react-auth
- [x] Configure PrivyProvider in main.tsx
- [x] Create public landing page with Connect Wallet
- [x] Update NavUser component with wallet info
- [ ] Test wallet connection flow

### 2.2 Onboarding Flow ✅ REMOVED

Onboarding was removed — users now set their profile (birthday, interests) directly in `/settings/profile` after wallet connect.

- [x] Removed `/onboarding` route and feature directory
- [x] Landing page redirects to `/settings` if birthDate not set
- [x] Profile page handles birthday + interests setup

### 2.3 Profile Management

- [ ] `/settings/profile` - Manage profile page
  - View/edit display name
  - View birthday (show only, no edit after set)
  - Edit interests (can update anytime)
  - View wallet address
  - Account created date
- [ ] Profile card component in sidebar/nav
- [ ] API: `GET /api/user/profile`, `PATCH /api/user/profile`

### 2.4 Route Pages

- [x] `/` - Public landing page
- [x] `/dashboard` - Authenticated dashboard (Potensi + Peluang combined)
- [x] `/compatibility` - Two dates → Mitra Satru result
- [x] `/wallet` - NEPTU balance, transactions, token stats, claim rewards
- [x] `/settings/profile` - Manage profile
- [ ] `/readings` - History of saved readings (optional)

### 2.5 Dashboard Components

- [x] `PotensiCard` - Birth reading (from saved birthday)
- [x] `PeluangCard` - Today's reading (auto-fetch daily)
- [x] `EnergyScoreCard` - Combined Potensi vs Peluang score display
- [x] `LifePurposeCard` - Lahir Untuk display
- [x] `DailyOpportunityCard` - Diberi Hak Untuk display
- [ ] `DailyInsight` - AI-powered comparison of Potensi vs Peluang
- [ ] `QuickActions` - Check-in, view wallet, compatibility

---

## Phase 3: Token & Payment 🔄 IN PROGRESS

### 3.1 Create packages/solana ✅ DONE

- [x] Create `packages/solana` package with @solana/kit
- [x] Constants: LAMPORTS_PER_SOL, TOKEN_DECIMALS, addresses
- [x] Conversion utilities: sol/lamports, neptu/raw
- [x] Token balance functions: getTokenBalance, getAssociatedTokenAddress
- [x] Reward calculation: calculateSolPaymentReward
- [x] Burn calculation: calculateNeptuPaymentBurn (50% burn rate)
- [x] Transaction verification: verifyTransaction, waitForConfirmation
- [x] Unit tests (17 tests passing)

### 3.2 Database Schema ✅ DONE

- [x] Create `tokenTransactions` table in drizzle-orm
- [x] DTO: TokenTransactionDTO
- [x] Validator: tokenTransactionSchema
- [x] Repository: TokenTransactionRepository
- [x] Service: TokenTransactionService

### 3.3 API Endpoints ✅ DONE

- [x] POST `/api/token/verify-payment` - Verify on-chain payment
- [x] GET `/api/token/transactions/:walletAddress` - Get user transactions
- [x] GET `/api/token/stats/:walletAddress` - Get user token stats
- [x] GET `/api/token/price/:readingType` - Get reading prices

### 3.4 Anchor Program (blockchain/solana) ✅ DONE

- [x] Initialize Anchor workspace `blockchain/solana/neptu`
- [x] Create `neptu-token` program
  - Mint authority: ecosystem pool
  - Initialize mint with 9 decimals
  - Initial supply: 1B tokens
- [x] Create `neptu-economy` program
  - `pay_with_sol` instruction (SOL → treasury, NEPTU reward → user)
  - `pay_with_neptu` instruction (50% burn, 50% recycle)
  - `claim_gamification_rewards` instruction (admin signature)
- [x] Deploy to Devnet (programs are upgradeable)
  - `neptu_token`: 7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW
  - `neptu_economy`: 6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT
- [x] TypeScript SDK in `packages/solana/src/programs/index.ts`
  - Pure @solana/kit (no legacy web3.js)
  - Transaction builders for all instructions

### 3.5 Payment API Routes ✅ DONE

- [x] POST `/api/pay/sol/build` - Build SOL payment transaction
- [x] POST `/api/pay/neptu/build` - Build NEPTU payment transaction
- [x] POST `/api/pay/verify` - Verify on-chain transaction
- [x] POST `/api/pay/claim/build` - Build claim rewards transaction
- [x] GET `/api/pay/pricing` - Get all reading prices
- [x] GET `/api/pay/pricing/:readingType` - Get specific reading price

### 3.6 Gamification Database ✅ DONE

- [x] Add `user_rewards` schema
  - Track unclaimed rewards (status = "pending")
  - Store claim tx signature when claimed
  - Fields: rewardType, neptuAmount, status, claimTxSignature, expiresAt
- [x] Add `user_streaks` schema
  - currentStreak, longestStreak, lastCheckIn, totalCheckIns
- [x] Add `referrals` schema
  - referrerId, refereeId, referrerRewardPaid, refereeRewardPaid
- [x] Create DTOs for each (user-reward-dto, user-streak-dto, referral-dto)
- [x] Create validators with Zod schemas
- [x] Create repositories with CRUD + aggregation queries
- [x] Create services with business logic
  - UserRewardService: grantDailyCheckInReward, grantStreakBonus, grantReferralReward, claimReward
  - UserStreakService: recordCheckIn, isStreakActive, getNextMilestone, getMilestoneReward
  - ReferralService: createReferral, processReferralRewards, getReferralStats, generateReferralCode
- [x] Add GAMIFICATION_REWARDS and STREAK_MILESTONES constants to @neptu/shared
- [x] Unit tests (28 new tests passing, 34 total with bun-sqlite test helper)

### 3.7 Payment UI ✅ DONE

- [x] `PaymentToggle` - Switch between SOL/NEPTU payment methods
  - Shows pricing for each option
  - Displays reward (SOL) or burn (NEPTU) info
- [x] Payment processing with loading states

### 3.8 Rewards UI ✅ DONE

- [x] `UnclaimedRewards` - Display unclaimed rewards with total
  - Shows individual reward items with icons
  - Claim button with loading state
- [x] `StreakCounter` - Daily streak widget
  - Progress bar to next milestone
  - Check-in button with reward preview
  - Stats: totalCheckIns, longestStreak

---

## Phase 4: AI Agent ✅ DONE

### 4.1 Oracle Chat ✅ DONE

- [x] Azure OpenAI gpt-4o-mini integration (apps/worker)
- [x] NeptuOracle class with system prompt for Balinese astrology
- [x] Oracle API endpoints in apps/worker
  - POST `/api/oracle` — Ask question with Potensi+Peluang context
  - GET `/api/oracle/daily/:birthDate` — Daily interpretation
  - POST `/api/oracle/interpret` — Interpret specific date
- [x] Oracle Sheet UI (chat interface in apps/web)

### 4.2 Context Injection ✅ DONE

- [x] Worker calculates Potensi from birthDate using NeptuCalculator
- [x] Worker calculates Peluang from targetDate using NeptuCalculator
- [x] Both injected as system context for AI responses
- [x] User's interests passed in question context for personalization

### 4.3 Agent Registration

- [x] Submitted to Colosseum

---

## Phase 5: Polish & Deploy 🔄 IN PROGRESS

### 5.0 Codebase Compatibility (Feb 9)

- [x] Upgraded Wrangler: removed worker's pinned `wrangler@^3.99.0` devDep, unified to root `wrangler@4`
- [x] Aligned `@cloudflare/workers-types` to `^4.20250214.0` across API, worker, drizzle-orm
- [x] Unified Zod version floor to `^3.25.56` in `apps/web`
- [x] Removed unused `@solana/spl-token` from `apps/web` (no source imports; `@neptu/solana` wraps `@solana/kit`)
- [x] Updated `compatibility_date` to `2025-12-01` in both wrangler.toml configs
- [x] Removed deprecated `version: "3"` from docker-compose.yml

### 5.0.1 Feature: Compatibility / Mitra Satru (Feb 9)

- [x] Added `CompatibilityResult`, `MitraSatruCategory`, `DimensionComparison` types to `@neptu/shared`
- [x] Added `MITRA_SATRU_PAIRS`, `MITRA_SATRU_DESCRIPTIONS`, `COMPATIBILITY_SCORES` constants to `@neptu/shared`
- [x] Implemented `calculateCompatibility(dateA, dateB)` in `packages/wariga` calculator
  - Compares Potensi of both birth dates
  - Cross-references Frekuensi (GURU/RATU/LARA/PATI) pairing via `MITRA_SATRU_PAIRS`
  - Calculates combined Frekuensi from both c24_urip values
  - Compares all 5 dimensions (Cipta, Rasa, Karsa, Tindakan, Siklus)
  - Weighted scoring: Frekuensi 40%, Cycles 30%, Traits 30%
- [x] Added `formatCompatibility()` to wariga formatter
- [x] Replaced placeholder API endpoint `POST /api/reading/compatibility` with real Mitra Satru logic
- [x] Added `getCompatibility()` method to web API client
- [x] Created `features/compatibility/` module:
  - `compatibility-page.tsx` — standalone page with two date pickers + results
  - `components/compatibility-scores.tsx` — score bar visualization
  - `components/dimension-comparison.tsx` — trait-by-trait comparison
- [x] Added compatibility route at `/compatibility`
- [x] Updated sidebar nav: Compatibility now points to `/compatibility` (was `/coming-soon`)
- [x] Updated dashboard TopNav: enabled Compatibility link
- [x] Added compatibility i18n keys to all 10 language files
- [x] Added 7 new wariga calculator tests (19 total, all passing)
- [x] All 70 tests pass (19 wariga + 34 drizzle-orm + 17 solana)

### 5.1 Deployment

- [ ] Deploy web to Vercel/Cloudflare
- [ ] Deploy API
- [ ] Configure environment variables
- [ ] Test on devnet

### 5.2 Submission

- [ ] Demo video (3-5 min)
- [ ] GitHub repo (public)
- [ ] Colosseum submission
- [ ] Forum post with demo

---

## Current Progress (Feb 4)

### ✅ Completed Today

- Deployed Anchor programs to Devnet
  - neptu_token: 7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW
  - neptu_economy: 6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT
- Created payment API routes in `apps/api/src/routes/payment.ts`
- All programs are upgradeable (default Anchor behavior)

### 🎯 Next Up

1. Implement Gamification Database (streaks, referrals, rewards)
2. Build Payment UI components
3. Build Rewards UI components
4. Integrate with frontend reading pages

---

## Quick Commands

```bash
# Start dev
bun run dev

# Only web
bun run --filter shadcn-admin dev

# Only API
bun run --filter @neptu/api dev

# Typecheck
bun run typecheck

# Format
bun run format

# Test specific package
bun run --filter @neptu/solana test
```
