import { createLogger } from "@neptu/logger";
import { Hono } from "hono";

import {
  fetchMarketData,
  getCachedMarket,
  getFallbackMarket,
} from "../market-fetcher";

const log = createLogger({ name: "market-route" });

export const market = new Hono();

market.get("/", async (c) => {
  try {
    const cached = await getCachedMarket();
    if (cached) {
      return c.json({ success: true, data: cached, source: "cache" });
    }

    const fresh = await fetchMarketData();
    if (fresh) {
      return c.json({ success: true, data: fresh, source: "fresh" });
    }

    const fallback = await getFallbackMarket();
    if (fallback) {
      return c.json({ success: true, data: fallback, source: "fallback" });
    }

    return c.json({ success: false, error: "No market data available" }, 502);
  } catch (error) {
    log.error({ error }, "Market route error");
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

market.post("/refresh", async (c) => {
  try {
    const fresh = await fetchMarketData();
    if (fresh) {
      return c.json({ success: true, data: fresh, source: "fresh" });
    }

    const fallback = await getFallbackMarket();
    if (fallback) {
      return c.json({ success: true, data: fallback, source: "fallback" });
    }

    return c.json(
      { success: false, error: "Rate limit reached, no fallback available" },
      502
    );
  } catch (error) {
    log.error({ error }, "Market refresh error");
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
