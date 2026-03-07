import { describe, expect, mock, test } from "bun:test";

import {
  ALPHA_VANTAGE_API,
  AV_TOPIC_MAP,
  CATEGORY_KEYWORDS,
  MARKET_CATEGORIES,
  MARKET_CATEGORY_CONFIG,
  type MarketResponse,
} from "@neptu/shared";

import { categorizeTopic } from "../src/market-fetcher";

/* ── Shared constants ────────────────────────────────── */

describe("Shared market constants", () => {
  test("ALPHA_VANTAGE_API has required fields", () => {
    expect(ALPHA_VANTAGE_API.ENDPOINT).toBe(
      "https://www.alphavantage.co/query"
    );
    expect(ALPHA_VANTAGE_API.FUNCTION).toBe("NEWS_SENTIMENT");
    expect(ALPHA_VANTAGE_API.CACHE_KEY).toBe("market:latest");
    expect(ALPHA_VANTAGE_API.CACHE_TTL).toBeGreaterThan(0);
    expect(ALPHA_VANTAGE_API.LIMIT).toBeGreaterThan(0);
    expect(ALPHA_VANTAGE_API.TOPICS.length).toBeGreaterThan(0);
  });

  test("every MARKET_CATEGORY has a config entry", () => {
    for (const cat of MARKET_CATEGORIES) {
      const cfg = MARKET_CATEGORY_CONFIG[cat];
      expect(cfg).toBeDefined();
      expect(cfg.label).toBeTruthy();
      expect(cfg.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test("AV_TOPIC_MAP maps to valid categories", () => {
    const validCats = new Set<string>(MARKET_CATEGORIES);
    for (const [, cats] of Object.entries(AV_TOPIC_MAP)) {
      for (const c of cats) {
        expect(validCats.has(c)).toBe(true);
      }
    }
  });

  test("CATEGORY_KEYWORDS keys match MARKET_CATEGORIES", () => {
    const kwKeys = Object.keys(CATEGORY_KEYWORDS).sort();
    const catKeys = [...MARKET_CATEGORIES].sort();
    expect(kwKeys).toEqual(catKeys);
  });
});

/* ── categorizeTopic ─────────────────────────────────── */

describe("categorizeTopic", () => {
  test("detects crypto from keywords", () => {
    const cats = categorizeTopic("Bitcoin", ["BTC price surges"]);
    expect(cats).toContain("crypto");
  });

  test("detects forex from keywords", () => {
    const cats = categorizeTopic("USD/EUR", ["dollar weakens against euro"]);
    expect(cats).toContain("forex");
  });

  test("detects stock from keywords", () => {
    const cats = categorizeTopic("AAPL", [
      "Apple earnings beat expectations on Wall Street",
    ]);
    expect(cats).toContain("stock");
  });

  test("preserves existing categories", () => {
    const cats = categorizeTopic("Random", ["nothing special"], ["crypto"]);
    expect(cats).toContain("crypto");
  });

  test("defaults to stock when no match", () => {
    const cats = categorizeTopic("xyzzy", ["completely unrelated topic"]);
    expect(cats).toContain("stock");
  });

  test("detects multiple categories from a rich headline", () => {
    const cats = categorizeTopic("Bitcoin", [
      "SEC proposes new crypto regulation on blockchain ETF",
    ]);
    expect(cats).toContain("crypto");
    expect(cats).toContain("stock");
  });
});

/* ── fetchMarketData with mocked fetch ─────────────── */

describe("fetchMarketData integration", () => {
  const AV_MOCK_RESPONSE = {
    items: "3",
    feed: [
      {
        title: "Bitcoin reaches new ATH amid ETF surge",
        url: "https://example.com/1",
        time_published: "20250101T120000",
        summary: "Bitcoin surges past 100k",
        banner_image: null,
        source: "MockNews",
        source_domain: "mocknews.com",
        category_within_source: "Crypto",
        topics: [{ topic: "Blockchain", relevance_score: "0.95" }],
        overall_sentiment_score: 0.45,
        overall_sentiment_label: "Bullish",
        ticker_sentiment: [
          {
            ticker: "CRYPTO:BTC",
            relevance_score: "0.99",
            ticker_sentiment_score: "0.5",
            ticker_sentiment_label: "Bullish",
          },
        ],
      },
      {
        title: "Bitcoin correction feared by analysts",
        url: "https://example.com/2",
        time_published: "20250101T110000",
        summary: "Analysts warn of pullback",
        banner_image: null,
        source: "MockNews",
        source_domain: "mocknews.com",
        category_within_source: "Crypto",
        topics: [{ topic: "Blockchain", relevance_score: "0.90" }],
        overall_sentiment_score: -0.3,
        overall_sentiment_label: "Bearish",
        ticker_sentiment: [
          {
            ticker: "CRYPTO:BTC",
            relevance_score: "0.99",
            ticker_sentiment_score: "-0.3",
            ticker_sentiment_label: "Bearish",
          },
        ],
      },
      {
        title: "Fed signals pause in rate hikes",
        url: "https://example.com/3",
        time_published: "20250101T100000",
        summary: "Federal Reserve holds steady",
        banner_image: null,
        source: "Reuters",
        source_domain: "reuters.com",
        category_within_source: "Economy",
        topics: [
          { topic: "Economy - Monetary", relevance_score: "0.98" },
          { topic: "Financial Markets", relevance_score: "0.80" },
        ],
        overall_sentiment_score: 0.05,
        overall_sentiment_label: "Neutral",
        ticker_sentiment: [],
      },
    ],
  };

  test("processes AV response into MarketResponse", async () => {
    process.env["ALPHA_VANTAGE_API_KEY"] = "test-key";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(AV_MOCK_RESPONSE), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const redisMock = await import("../src/cache");
    const putSpy = mock(() => Promise.resolve());
    const getSpy = mock(() => Promise.resolve(null));
    Object.defineProperty(redisMock.redisCache, "put", { value: putSpy });
    Object.defineProperty(redisMock.redisCache, "get", { value: getSpy });

    const { fetchMarketData } = await import("../src/market-fetcher");
    const result = await fetchMarketData();

    expect(result).not.toBeNull();
    const data = result as MarketResponse;
    expect(data.assets.length).toBeGreaterThan(0);
    expect(data.timeWindow).toBe("24h");
    expect(data.fetchedAt).toBeTruthy();
    expect(data.articlesAnalyzed).toBeGreaterThan(0);

    const btcTopic = data.assets.find((t) =>
      t.topic.toLowerCase().includes("btc")
    );
    if (btcTopic) {
      expect(btcTopic.categories).toContain("crypto");
      expect(btcTopic.count).toBeGreaterThanOrEqual(2);
    }

    const fedTopic = data.assets.find(
      (t) =>
        t.topic.toLowerCase().includes("economy") ||
        t.topic.toLowerCase().includes("fed")
    );
    if (fedTopic) {
      expect(fedTopic.categories).toContain("stock");
    }

    globalThis.fetch = originalFetch;
    delete process.env["ALPHA_VANTAGE_API_KEY"];
  });

  test("returns null when API key is missing", async () => {
    delete process.env["ALPHA_VANTAGE_API_KEY"];

    const redisMock = await import("../src/cache");
    Object.defineProperty(redisMock.redisCache, "put", {
      value: mock(() => Promise.resolve()),
    });

    const { fetchMarketData } = await import("../src/market-fetcher");
    const result = await fetchMarketData();
    expect(result).toBeNull();
  });
});
