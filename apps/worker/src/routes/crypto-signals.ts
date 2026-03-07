import { createLogger } from "@neptu/logger";
import {
  FEAR_GREED_API,
  DERIVATIVES_API,
  FUNDING_RATE_THRESHOLDS,
  FORBES_WEALTH_FLOW_API,
} from "@neptu/shared";
import ccxt, { type Exchange } from "ccxt";
import { Hono } from "hono";

import { redisCache } from "../cache";

const log = createLogger({ name: "crypto-signals" });
const signals = new Hono();

/** Lazily-initialised CCXT exchange instance */
let exchange: Exchange | undefined;

function getExchange(): Exchange {
  if (!exchange) {
    const ExchangeClass = ccxt[DERIVATIVES_API.EXCHANGE];
    exchange = new ExchangeClass({ enableRateLimit: true });
  }
  return exchange;
}

/* ── Fear & Greed Index ──────────────────────────────── */

signals.get("/fear-greed", async (c) => {
  const cacheKey = "fear-greed";

  const cached = await redisCache.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached), 200, { "X-Cache": "HIT" });
  }

  try {
    const url = `${FEAR_GREED_API.URL}?limit=${FEAR_GREED_API.HISTORY_LIMIT}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      log.error("Fear & Greed API error: %d", res.status);
      return c.json({ error: `Fear & Greed API returned ${res.status}` }, 502);
    }

    const body = await res.text();
    await redisCache.put(cacheKey, body, {
      expirationTtl: FEAR_GREED_API.CACHE_TTL,
    });

    return c.json(JSON.parse(body), 200, { "X-Cache": "MISS" });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/* ── Funding Rate (CCXT) ─────────────────────────────── */

signals.get("/funding-rate", async (c) => {
  const symbol = c.req.query("symbol") || DERIVATIVES_API.DEFAULT_SYMBOL;
  const cacheKey = `funding-rate:${symbol}`;

  const cached = await redisCache.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached), 200, { "X-Cache": "HIT" });
  }

  try {
    const ex = getExchange();
    const fundingRate = await ex.fetchFundingRate(symbol);

    const rate = fundingRate.fundingRate ?? 0;
    const ratePercent = rate * 100;
    let interpretation:
      | "neutral"
      | "overleveraged_long"
      | "overleveraged_short" = "neutral";
    if (ratePercent > FUNDING_RATE_THRESHOLDS.OVERLEVERAGED_LONG)
      interpretation = "overleveraged_long";
    else if (ratePercent < FUNDING_RATE_THRESHOLDS.OVERLEVERAGED_SHORT)
      interpretation = "overleveraged_short";

    const result = {
      success: true,
      symbol: fundingRate.symbol,
      rate,
      ratePercent,
      fundingTime: fundingRate.fundingTimestamp ?? Date.now(),
      interpretation,
    };

    const body = JSON.stringify(result);
    await redisCache.put(cacheKey, body, {
      expirationTtl: DERIVATIVES_API.CACHE_TTL,
    });

    return c.json(result, 200, { "X-Cache": "MISS" });
  } catch (error) {
    log.error(
      "Funding rate error: %s",
      error instanceof Error ? error.message : error
    );
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/* ── Open Interest (CCXT) ────────────────────────────── */

signals.get("/open-interest", async (c) => {
  const symbol = c.req.query("symbol") || DERIVATIVES_API.DEFAULT_SYMBOL;
  const cacheKey = `open-interest:${symbol}`;

  const cached = await redisCache.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached), 200, { "X-Cache": "HIT" });
  }

  try {
    const ex = getExchange();
    const positions = await ex.fetchOpenInterest(symbol);

    const result = {
      success: true,
      symbol: positions.symbol,
      openInterest: positions.openInterestAmount ?? 0,
      time: positions.timestamp ?? Date.now(),
    };

    const body = JSON.stringify(result);
    await redisCache.put(cacheKey, body, {
      expirationTtl: DERIVATIVES_API.CACHE_TTL,
    });

    return c.json(result, 200, { "X-Cache": "MISS" });
  } catch (error) {
    log.error(
      "Open interest error: %s",
      error instanceof Error ? error.message : error
    );
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/* ── Forbes Wealth Flow ──────────────────────────────── */

interface ForbesPersonRaw {
  rank: number;
  personName: string;
  finalWorth: number;
  estWorthPrev: number;
  uri: string;
  squareImage?: string;
  countryOfCitizenship?: string;
}

interface WealthMover {
  name: string;
  changeBillions: number;
  netWorthBillions: number;
  rank: number;
  country: string | null;
  imageUrl: string | null;
}

function toWealthMover(raw: ForbesPersonRaw): WealthMover {
  const net = raw.finalWorth / FORBES_WEALTH_FLOW_API.WORTH_DIVISOR;
  const prev = raw.estWorthPrev / FORBES_WEALTH_FLOW_API.WORTH_DIVISOR;
  return {
    name: raw.personName,
    changeBillions: Math.round((net - prev) * 100) / 100,
    netWorthBillions: Math.round(net * 100) / 100,
    rank: raw.rank,
    country: raw.countryOfCitizenship ?? null,
    imageUrl: raw.squareImage ?? null,
  };
}

signals.get("/wealth-flow", async (c) => {
  const cacheKey = "wealth-flow";

  const cached = await redisCache.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached), 200, { "X-Cache": "HIT" });
  }

  try {
    const url = `${FORBES_WEALTH_FLOW_API.URL}?limit=${FORBES_WEALTH_FLOW_API.LIMIT}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      log.error("Forbes wealth-flow API error: %d", res.status);
      return c.json({ error: `Forbes API returned ${res.status}` }, 502);
    }

    const raw = (await res.json()) as {
      personList: { personsLists: ForbesPersonRaw[] };
    };
    const people = (raw.personList?.personsLists ?? []).map(toWealthMover);
    const sorted = [...people].sort(
      (a, b) => b.changeBillions - a.changeBillions
    );
    const topCount = FORBES_WEALTH_FLOW_API.TOP_MOVERS_COUNT;

    const totalDailyChange = people.reduce(
      (sum, p) => sum + p.changeBillions,
      0
    );
    const totalNetWorth = people.reduce(
      (sum, p) => sum + p.netWorthBillions,
      0
    );

    const result = {
      success: true,
      billionaireCount: people.length,
      totalDailyChange: Math.round(totalDailyChange * 100) / 100,
      totalNetWorth: Math.round(totalNetWorth * 100) / 100,
      topGainers: sorted.slice(0, topCount),
      topLosers: sorted.slice(-topCount).reverse(),
    };

    const body = JSON.stringify(result);
    await redisCache.put(cacheKey, body, {
      expirationTtl: FORBES_WEALTH_FLOW_API.CACHE_TTL,
    });

    return c.json(result, 200, { "X-Cache": "MISS" });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export { signals };
