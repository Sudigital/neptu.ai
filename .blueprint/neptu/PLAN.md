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
| 6     | World Economic  | 🔄 IN PROGRESS | 3-5  |

> **Phase 6 Details:** See [WORLD-ECONOMIC.md](./WORLD-ECONOMIC.md) for full spec, gap analysis, and 4-phase implementation plan.

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

## Phase 6: World Economic Dashboard 🔄 IN PROGRESS

> Full spec: [WORLD-ECONOMIC.md](./WORLD-ECONOMIC.md)
> Route: `/admin/world-economic`

### 6.0 Current State (What Exists)

| File                            | Lines | Purpose                                                                                |
| ------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `admin-world-economic.tsx`      | 367   | Main layout: BTC chart + Fibonacci, sentiment gauge, day selector, people table        |
| `world-economic-parts.tsx`      | ~500  | Types, sentiment formula (4-factor weighted), Fibonacci levels, figure row computation |
| `world-economic-components.tsx` | 233   | SVG semicircular gauge (5 zones), BTC tooltip, prosperity card                         |
| `world-economic-table.tsx`      | 218   | TanStack Table with faceted filters (category, tags, mitra/satru), row selection       |
| `world-economic-columns.tsx`    | ~250  | 11 column definitions with custom cells                                                |

Data already flowing:

- BTC chart via `WORKER/api/crypto/chart/bitcoin` (Redis cached)
- 13-coin market data via `WORKER/api/crypto/market` (every 10min BullMQ) — **exists but UNUSED in dashboard**
- 165 notable figures via `API/api/v1/admin/notable-figures`
- Forbes billionaire data already crawled (name, netWorth, dailyChange, industry, tags)

### 6.1 Multi-Coin Market Grid (Phase 6.1) — Quick Win

> Zero backend changes. Worker already has all data via `/api/crypto/market`.

**Task list:**

- [ ] Create `world-economic-market-grid.tsx` — compact coin card grid
  - Fetch `WORKER/api/crypto/market` (already returns 13 coins with price, 24h%, volume, marketCap, image)
  - Display: coin icon + name, price, 24h change badge (green/red), volume abbreviated
  - Computed: BTC Dominance (BTC marketCap / total), winners vs losers count
  - Layout: responsive grid (2-col mobile, 4-col tablet, 6-col desktop)
- [ ] Add `useQuery` for market data in `admin-world-economic.tsx`
- [ ] Mount `<CryptoMarketGrid>` between chart section and people table
- [ ] Add market data types to `world-economic-parts.tsx` (interface `CryptoMarketCoin`)

**Files touched:** 1 new + 2 modified **Effort:** ~2 hours

### 6.2 Fear & Greed Index + Dual Gauge (Phase 6.2)

> Adds traditional Crypto Fear & Greed alongside Neptu astrology sentiment.

**Backend — Worker (1 new route):**

- [ ] Add `GET /api/crypto/fear-greed` in `apps/worker/src/routes/crypto.ts`
  - Proxy: `https://api.alternative.me/fng/?limit=30` (free, no API key)
  - Redis cache: 1-hour TTL (key: `fear-greed`)
  - Response: `{ score: number, classification: string, timestamp: number, history: Array<{value, classification, timestamp}> }`
- [ ] Add shared constants: `FEAR_GREED_API_URL`, `FEAR_GREED_CACHE_TTL` in `packages/shared/src/constants/crypto.ts`

**Frontend — Web (1 new file + modify main layout):**

- [ ] Create `world-economic-signals.tsx` — dual gauge + divergence alert
  - Left gauge: existing Neptu Astrology Sentiment (extract from current gauge usage)
  - Right gauge: traditional Crypto F&G (reuse `MarketSentimentGauge` pattern)
  - Divergence banner: shows when zones differ by 2+ levels (e.g., Astrology=Greed + F&G=Fear)
  - 30-day F&G sparkline under the traditional gauge
- [ ] Update `admin-world-economic.tsx` layout to 3-column: chart (2/3) + dual gauge (1/3 stacked)
- [ ] Add F&G types + fetch helper to `world-economic-parts.tsx`

**Files touched:** 1 new + 3 modified (crypto.ts, crypto.ts shared, main layout, parts) **Effort:** ~3 hours

### 6.3 Derivatives Signal Cards (Phase 6.3)

> Adds BTC funding rate + open interest from Binance Futures (free, no auth).

**Backend — Worker (2 new routes):**

- [ ] Add `GET /api/crypto/funding-rate` in `apps/worker/src/routes/crypto.ts`
  - Upstream: `https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1`
  - Redis cache: 5-min TTL
  - Response: `{ rate: number, timestamp: number, interpretation: "neutral"|"overleveraged_long"|"overleveraged_short" }`
- [ ] Add `GET /api/crypto/open-interest` in `apps/worker/src/routes/crypto.ts`
  - Upstream: `https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT`
  - Redis cache: 5-min TTL
  - Response: `{ openInterest: number, symbol: string, timestamp: number }`
- [ ] Add shared constants: `BINANCE_FUTURES_API`, `FUNDING_RATE_THRESHOLDS`, `SIGNAL_CACHE_TTL` in shared

**Frontend — Web (extend existing):**

- [ ] Extend `world-economic-signals.tsx` with signal KPI cards row
  - 4 cards: Funding Rate | Open Interest | BTC Dominance (from 6.1 data) | Market Volume
  - Each card: value, label, interpretation badge (bullish/bearish/neutral)
  - Color-coded: green (bullish), red (bearish), yellow (neutral)
- [ ] Add signal types to `world-economic-parts.tsx`

**Files touched:** 2 modified (crypto route, shared constants) + 2 modified (signals, parts) **Effort:** ~3 hours

### 6.4 Forbes Wealth Flow Widget (Phase 6.4)

> Visualize aggregate billionaire wealth change as a macro risk signal.

**Backend — Worker (1 new route):**

- [ ] Add `GET /api/crypto/wealth-flow` in worker
  - Fetches Forbes RT Billionaires API: `https://www.forbes.com/forbesapi/person/rtb/0/position/true.json`
  - Computes: aggregate dailyChangeBillions for top 50 billionaires
  - Redis cache: 30-min TTL
  - Response: `{ totalDailyChange: number, totalNetWorth: number, topGainers: [...], topLosers: [...], billionaireCount: number }`

**Frontend — Web (1 new file):**

- [ ] Create `world-economic-wealth-flow.tsx`
  - Cards: total daily change (▲/▼ + $B), total net worth, top 3 gainers, top 3 losers
  - Color: green when positive (risk-on), red when negative (risk-off)
  - Layout: horizontal card strip, placed after signal cards
- [ ] Mount in `admin-world-economic.tsx`

**Files touched:** 1 new endpoint + 1 new component + 1 modified layout **Effort:** ~2 hours

### Phase 6 File Architecture (Target)

```
apps/web/src/features/admin/
├── admin-world-economic.tsx          ← Main layout (orchestrator, <500 lines)
├── world-economic-parts.tsx          ← Types + computation (sentiment, fib, helpers)
├── world-economic-components.tsx     ← SVG gauge, tooltips, prosperity card
├── world-economic-columns.tsx        ← Table column definitions
├── world-economic-table.tsx          ← TanStack Table + faceted filters
├── world-economic-market-grid.tsx    ← NEW: 13-coin heatmap grid (6.1)
├── world-economic-signals.tsx        ← NEW: Dual F&G gauge + KPI signal cards (6.2-6.3)
└── world-economic-wealth-flow.tsx    ← NEW: Forbes billionaire wealth flow (6.4)

apps/worker/src/routes/
└── crypto.ts                         ← ADD: /fear-greed, /funding-rate, /open-interest, /wealth-flow

packages/shared/src/constants/
└── crypto.ts                         ← ADD: F&G URL, Binance API, signal thresholds, cache TTLs
```

### Phase 6 Dashboard Layout (Target)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Header] World Economic & Market              [7D] [30D] [90D] [1Y]│
├───────────────────────────────────────┬─────────────────────────────┤
│  BTC Price + Fibonacci Retracement    │  Neptu      │  Crypto      │
│  (ComposedChart with fib lines)       │  Astrology  │  Fear&Greed  │
│  ████████████████████████████         │  [Gauge]    │  [Gauge]     │
│  ██████████                           │  67 Greed   │  32 Fear     │
│                                       │  4 stats    │  30d chart   │
├───────────────────────────────────────┴─────────────────────────────┤
│  [Funding Rate]  [Open Interest]  [BTC Dominance]  [Wealth Flow]   │
│   +0.012%          $18.2B           52.3%            ▲ +$4.2B       │
│   Neutral          ▲ +3.1%         ▼ -0.4%          Risk On        │
├─────────────────────────────────────────────────────────────────────┤
│  Crypto Market Overview (13 coins)                                  │
│  BTC $97K +1.2% | ETH $3.2K -0.8% | SOL $180 +3.1% | ...         │
├─────────────────────────────────────────────────────────────────────┤
│  People Analysis (TanStack Table — 165 figures)                     │
│  [Search] [Category▾] [Tags▾] [Mitra/Satru▾]                       │
│  ☑ Name          Age  Category  Tags       M/S    Pop  UP  DE  SI  │
│  ☐ Elon Musk     53   Ent,Bill  tech,ev    mitra  480  12  67  72  │
│  ☐ Donald Trump  79   WL        politics   satru  500  8   45  38  │
└─────────────────────────────────────────────────────────────────────┘
```

### Execution Order & Dependencies

```
6.1 Market Grid ──────────┐
                          ├──► 6.3 Signal Cards (needs BTC dominance from 6.1)
6.2 Fear & Greed ─────────┘
                                    │
                                    ▼
                              6.4 Wealth Flow (independent, last)
```

1. **Start 6.1** (zero backend, just consume existing `/api/crypto/market`)
2. **Then 6.2** (1 new worker route + new component — can parallelize frontend with 6.1)
3. **Then 6.3** (2 new worker routes + extend 6.2 component — needs BTC dominance data from 6.1)
4. **Finally 6.4** (1 new worker route + 1 new component — independent)

### Testing Plan

| Sub-phase | Test Scope                                                         | Where                          |
| --------- | ------------------------------------------------------------------ | ------------------------------ |
| 6.1       | Market grid renders 13 coins, BTC dominance computes correctly     | `apps/web/__tests__/`          |
| 6.2       | Fear & Greed worker route returns cached data, dual gauge renders  | `apps/worker/__tests__/` + web |
| 6.3       | Funding rate + OI routes work, signal interpretation logic correct | `apps/worker/__tests__/` + web |
| 6.4       | Wealth flow aggregation correct, widget renders                    | `apps/worker/__tests__/`       |

### Known Blockers

| Issue                          | Impact                            | Fix                                                             |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------- |
| Forbes imageUrl Zod validation | 34 billionaires skipped on insert | Sanitize/allow null imageUrl before Zod validation              |
| 500-line file limit            | All new features need new files   | Already planned with separate component files                   |
| CoinGecko rate limit           | Free tier 10-30 req/min           | Already mitigated with Redis caching + BullMQ scheduled refresh |

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
