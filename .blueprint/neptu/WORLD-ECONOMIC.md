# World Economic & Market Dashboard

> **Route:** `/admin/world-economic`
> **Status:** Phase 1 In Progress
> **Last Updated:** Feb 28, 2026

---

## Current State

### What Exists

| Component     | File                            | Lines | Description                                                      |
| ------------- | ------------------------------- | ----- | ---------------------------------------------------------------- |
| Main Layout   | `admin-world-economic.tsx`      | 367   | BTC chart + Fibonacci, sentiment gauge, day selector, data table |
| Computation   | `world-economic-parts.tsx`      | ~500  | Types, sentiment formula, Fibonacci levels, figure row mapping   |
| UI Components | `world-economic-components.tsx` | 233   | SVG gauge, tooltips, prosperity card                             |
| Table         | `world-economic-table.tsx`      | 218   | TanStack Table with faceted filters, row selection               |
| Columns       | `world-economic-columns.tsx`    | ~250  | 11 column definitions with custom cells                          |

### Data Sources

| Source              | Endpoint                                 | Refresh                        | Status                            |
| ------------------- | ---------------------------------------- | ------------------------------ | --------------------------------- |
| CoinGecko Chart     | `WORKER/api/crypto/chart/bitcoin?days=N` | Redis cached (10m-6h by range) | ✅ Active                         |
| CoinGecko Market    | `WORKER/api/crypto/market`               | Every 10min via BullMQ         | ✅ Active but UNUSED in dashboard |
| Notable Figures     | `API/api/v1/admin/notable-figures`       | 2min refetch                   | ✅ Active                         |
| Forbes Billionaires | Crawler (`crawl:forbes`)                 | Manual / seed                  | ✅ 165 people seeded              |

### Neptu Sentiment Engine (Unique Differentiator)

4-factor weighted score (25% each when all factors present):

| Factor                      | Source                       | What It Measures                           |
| --------------------------- | ---------------------------- | ------------------------------------------ |
| Prosperity (Sandang Pangan) | Birth urip + age → level 0-8 | Material fortune for current life period   |
| Compatibility (Mitra Satru) | Pairwise figure birthdays    | Alignment between powerful people          |
| Daily Energy                | Birthday vs today's date     | How today's energy aligns with each person |
| Urip Peluang                | Today relative to birthday   | Opportunity energy score                   |

**Sentiment Zones:** Extreme Fear (0-20) → Fear (21-40) → Neutral (41-60) → Greed (61-80) → Extreme Greed (81-100)

---

## Gap Analysis vs Professional Trading Checklist

| Checklist Area           | Current Coverage                           | Gap Level  |
| ------------------------ | ------------------------------------------ | ---------- |
| BTC Price + Fibonacci    | ✅ Full                                    | —          |
| Astrology Sentiment      | ✅ Full (unique)                           | —          |
| People Analytics Table   | ✅ Full                                    | —          |
| Multi-Coin Overview      | ❌ Worker has data, dashboard doesn't show | HIGH       |
| Traditional Fear & Greed | ❌ No external F&G index                   | HIGH       |
| Funding Rate / OI        | ❌ No derivatives data                     | MEDIUM     |
| On-Chain Signals         | ❌ No whale/exchange flow data             | MEDIUM     |
| Forbes Wealth Flow       | ❌ Data crawled but not visualized         | QUICK WIN  |
| Economic Calendar        | ❌ No macro event data                     | LOW-MEDIUM |
| Equity/Sector News       | ❌ Out of scope (crypto-focused)           | N/A        |

---

## Implementation Plan — 4 Phases

### Phase 1: Multi-Coin Market Grid (Quick Win)

> Use the 13-coin market data the worker already fetches every 10 minutes.

**New file:** `world-economic-market-grid.tsx`

**Layout:** Compact card grid below the BTC chart, above the people table.

**Data per coin (from `GET /api/crypto/market`):**

| Field                      | Display                    |
| -------------------------- | -------------------------- |
| `currentPrice`             | Price with currency format |
| `priceChangePercentage24h` | Green/red badge with arrow |
| `totalVolume`              | Abbreviated (e.g., $2.1B)  |
| `marketCap`                | Abbreviated                |
| `high24h`, `low24h`        | 24h range bar              |
| `image`                    | Coin icon                  |

**Computed metrics:**

- BTC Dominance = BTC market cap / sum of all 13 market caps
- Total market volume change
- Winners vs losers count (green vs red)

**13 tracked coins:** BTC, ETH, USDT, BNB, XRP, USDC, SOL, TRX, DOGE, BCH, ADA, LINK, AVAX

**Mini sparklines:** Reuse `WORKER/api/crypto/chart/:id?days=7` for each coin (7-day mini chart)

**Effort:** ~1 new component file + query hook in main layout

---

### Phase 2: Traditional Fear & Greed + Composite Index

> Dual gauge: Neptu Astrology Sentiment alongside traditional Crypto Fear & Greed.

**New worker route:** `GET /api/crypto/fear-greed`

- Proxy: `https://api.alternative.me/fng/?limit=30` (free, no API key)
- Returns: daily score (0-100), classification, 30-day history
- Cache: Redis, 1-hour TTL

**New file:** `world-economic-signals.tsx`

**Layout:** Replace single gauge with dual-gauge row:

```
┌──────────────────────┬──────────────────────┐
│  Neptu Astrology     │  Crypto Fear & Greed │
│  Sentiment (existing)│  (Alternative.me)    │
│  [SVG Gauge]         │  [SVG Gauge]         │
│  Score: 67 Greed     │  Score: 32 Fear      │
│                      │                      │
│  Prosperity: 71%     │  30-day mini chart   │
│  Daily Energy: 63%   │  Classification text │
│  Urip Peluang: 68%   │  Data source label   │
│  Compatibility: 58%  │                      │
├──────────────────────┴──────────────────────┤
│  DIVERGENCE ALERT: Astrology=Greed but      │
│  Market=Fear → Potential contrarian signal   │
└─────────────────────────────────────────────┘
```

**Composite "Neptu Alpha" score:**

- Blend: 60% Neptu Astrology + 40% Traditional F&G
- Divergence detection: when zones differ by 2+ levels → alert banner

**Effort:** 1 new worker route, 1-2 new component files

---

### Phase 3: Derivatives & On-Chain Signal Cards

> Compact KPI cards, not full charts — designed for quick scanning.

**New worker routes:**

| Route                           | Upstream Source              | Data                            |
| ------------------------------- | ---------------------------- | ------------------------------- |
| `GET /api/crypto/funding-rate`  | Binance Futures API (no key) | BTC/USDT perpetual funding rate |
| `GET /api/crypto/open-interest` | Binance Futures API (no key) | BTC open interest + 24h change  |

**Binance Futures API (free, no auth):**

- Funding rate: `GET https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1`
- Open interest: `GET https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT`

**New file:** `world-economic-signals.tsx` (extend from Phase 2)

**Layout:** Signal card row between gauges and people table:

```
┌──────────┬──────────┬──────────┬──────────┐
│ Funding  │ Open     │ BTC      │ Billionaire│
│ Rate     │ Interest │ Dominance│ Wealth    │
│          │          │          │ Flow      │
│ +0.012%  │ $18.2B   │ 52.3%    │ ▲ +$4.2B │
│ Neutral  │ ▲ +3.1%  │ ▼ -0.4%  │ Risk On  │
└──────────┴──────────┴──────────┴──────────┘
```

**Signal interpretation:**

- Funding Rate: > 0.03% = Overleveraged Long, < -0.01% = Overleveraged Short
- Open Interest rising + price rising = Strong trend
- BTC Dominance: computed from Phase 1 market data
- Billionaire Wealth Flow: aggregate `dailyChangeBillions` from Forbes data

**Effort:** 2 new worker routes, extend signals component

---

### Phase 4: Forbes Wealth Flow + Economic Calendar

> Macro context layer using data we already have + free calendar API.

**Forbes Billionaire Aggregate Widget:**

- Sum `dailyChangeBillions` across all 66 Forbes billionaires
- Positive = risk-on signal, negative = risk-off
- Show top 5 gainers/losers by daily change
- Requires: extend Forbes crawler to store `dailyChangeBillions` in DB, or add a new worker route that fetches fresh from Forbes API

**Economic Calendar (Optional):**

- Source: Trading Economics or Forex Factory RSS
- Show: Next 5 major events (FOMC, CPI, NFP, ECB)
- Display: date, event name, impact level (high/medium/low), forecast vs previous

**New file:** `world-economic-wealth-flow.tsx`

**Effort:** 1 new component file, possibly 1 new worker route

---

## File Architecture

```
apps/web/src/features/admin/
├── admin-world-economic.tsx          ← Main layout (max 500 lines)
├── world-economic-parts.tsx          ← Types + computation logic
├── world-economic-components.tsx     ← Gauge, tooltips, prosperity card
├── world-economic-columns.tsx        ← Table column definitions
├── world-economic-table.tsx          ← TanStack Table + filters
├── world-economic-market-grid.tsx    ← Phase 1: 13-coin heatmap/grid
├── world-economic-signals.tsx        ← Phase 2-3: F&G gauge + KPI cards
└── world-economic-wealth-flow.tsx    ← Phase 4: Forbes aggregate + calendar

apps/worker/src/
├── routes/
│   └── crypto.ts                     ← Add: /fear-greed, /funding-rate, /open-interest
└── ...

packages/shared/src/constants/
└── crypto.ts                         ← Add: F&G zones, signal thresholds, cache TTLs
```

---

## Dashboard Layout (Target)

```
┌─────────────────────────────────────────────────────────────┐
│ [Header] World Economic & Market    [7D][30D][90D][1Y]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────┐  ┌──────────┬──────────┐  │
│  │  BTC Price + Fibonacci      │  │ Neptu    │ Crypto   │  │
│  │  (ComposedChart)            │  │ Sentiment│ F&G      │  │
│  │  [Area + ReferenceLine]     │  │ [Gauge]  │ [Gauge]  │  │
│  │                             │  │  67      │  32      │  │
│  │                             │  │  Greed   │  Fear    │  │
│  └─────────────────────────────┘  └──────────┴──────────┘  │
│                                                             │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Funding  │ Open     │ BTC      │Billionaire│             │
│  │ Rate     │ Interest │ Dominance│ Wealth    │             │
│  │ +0.012%  │ $18.2B   │ 52.3%   │ ▲ +$4.2B │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Crypto Market Overview (13 coins grid)             │   │
│  │  BTC | ETH | SOL | BNB | XRP | ADA | DOGE | ...    │   │
│  │  $97K  $3.2K $180  $610  $2.4  $1.2  $0.32         │   │
│  │  +1.2% -0.8% +3.1% +0.5% -1.3% +2.1% +5.2%       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  People Analysis (TanStack Table)                   │   │
│  │  [Search] [Category▾] [Tags▾] [Mitra/Satru▾]       │   │
│  │  ┌──┬─────┬───┬────┬────┬────┬───┬───┬───┬───┐     │   │
│  │  │☑ │Name │Age│Cat │Tags│M/S │Pop│UP │DE │SI │     │   │
│  │  ├──┼─────┼───┼────┼────┼────┼───┼───┼───┼───┤     │   │
│  │  │☐ │Elon │53 │Ent │tech│mitra│480│12 │67 │72 │     │   │
│  │  │☐ │Trump│79 │WL  │pol │satru│500│8  │45 │38 │     │   │
│  │  └──┴─────┴───┴────┴────┴────┴───┴───┴───┴───┘     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Dependencies

### Existing (No Changes Needed)

| Endpoint                           | Source     | Auth             |
| ---------------------------------- | ---------- | ---------------- |
| `WORKER/api/crypto/chart/:id`      | CoinGecko  | Optional API key |
| `WORKER/api/crypto/market`         | CoinGecko  | Optional API key |
| `API/api/v1/admin/notable-figures` | PostgreSQL | Admin JWT        |

### New Worker Routes (To Build)

| Endpoint                        | Upstream        | Auth        | Cache TTL |
| ------------------------------- | --------------- | ----------- | --------- |
| `GET /api/crypto/fear-greed`    | Alternative.me  | None (free) | 1 hour    |
| `GET /api/crypto/funding-rate`  | Binance Futures | None (free) | 5 min     |
| `GET /api/crypto/open-interest` | Binance Futures | None (free) | 5 min     |

### External API References

| API                  | Base URL                            | Rate Limit | Key Required |
| -------------------- | ----------------------------------- | ---------- | ------------ |
| Alternative.me F&G   | `https://api.alternative.me/fng/`   | Generous   | No           |
| Binance Futures      | `https://fapi.binance.com/fapi/v1/` | 1200/min   | No           |
| CoinGecko (existing) | `https://api.coingecko.com/api/v3/` | 10-30/min  | Optional     |

---

## Known Issues

| Issue                      | Priority | Description                                                                                                            |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Forbes imageUrl validation | MEDIUM   | 34 Forbes billionaires skipped during insert due to Zod URL validation error. Need to sanitize or allow null imageUrl. |
| Billionaire count          | LOW      | Target is 66 but only ~46 inserted. Blocked by imageUrl issue above.                                                   |
| File line limits           | ONGOING  | All files must stay under 500 lines per oxlint rules. New phases require new files, not expanding existing ones.       |

---

## Database Requirements

No new tables needed for Phases 1-3. All new data comes from external APIs proxied through the worker with Redis caching.

Phase 4 (Forbes Wealth Flow) may need:

- New column `daily_change_billions` on `notable_figures` table, OR
- A new worker route that fetches fresh Forbes data on demand

---

## Testing Plan

| Phase   | Tests                                                                                                           |
| ------- | --------------------------------------------------------------------------------------------------------------- |
| Phase 1 | Worker: `crypto/market` endpoint returns all 13 coins. Web: market grid renders with mock data.                 |
| Phase 2 | Worker: `crypto/fear-greed` proxy returns valid F&G data. Web: dual gauge renders, divergence detection works.  |
| Phase 3 | Worker: `crypto/funding-rate` and `crypto/open-interest` return valid data. Web: signal cards render correctly. |
| Phase 4 | Crawler: Forbes `dailyChangeBillions` stored correctly. Web: wealth flow widget aggregates and displays.        |
