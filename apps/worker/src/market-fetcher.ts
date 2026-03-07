import { createLogger } from "@neptu/logger";
import {
  ALPHA_VANTAGE_API,
  AV_TOPIC_MAP,
  CATEGORY_KEYWORDS,
  type MarketAsset,
  type MarketCategory,
  type MarketResponse,
  type MarketSentiment,
} from "@neptu/shared";

import { redisCache } from "./cache";

const log = createLogger({ name: "market-fetcher" });

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HEADLINES_PER_TOPIC = 8;
const MIN_RELEVANCE = 0.3;
const SENTIMENT_THRESHOLD = 0.15;

/* ── Alpha Vantage response types ────────────────────── */

interface AVTopicTag {
  topic: string;
  relevance_score: string;
}

interface AVFeedItem {
  title: string;
  url: string;
  time_published: string;
  summary: string;
  banner_image: string | null;
  source: string;
  source_domain: string;
  category_within_source: string;
  topics: AVTopicTag[];
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: {
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }[];
}

interface AVResponse {
  items?: string;
  feed?: AVFeedItem[];
  Information?: string;
  "Error Message"?: string;
}

/* ── Map AV sentiment label → our sentiment ──────────── */

function mapSentiment(label: string, score: number): MarketSentiment {
  const lower = label.toLowerCase();
  if (lower.includes("bullish")) return "bullish";
  if (lower.includes("bearish")) return "bearish";
  if (score > SENTIMENT_THRESHOLD) return "bullish";
  if (score < -SENTIMENT_THRESHOLD) return "bearish";
  return "neutral";
}

/* ── Map AV topic tags → our categories ──────────────── */

function mapAvTopics(avTopics: AVTopicTag[]): MarketCategory[] {
  const cats = new Set<MarketCategory>();

  for (const tag of avTopics) {
    const relevance = parseFloat(tag.relevance_score);
    if (relevance < MIN_RELEVANCE) continue;

    const mapped = AV_TOPIC_MAP[tag.topic];
    if (mapped) {
      for (const c of mapped) cats.add(c);
    }
  }

  return [...cats];
}

/* ── Keyword-based category enrichment ───────────────── */

export function categorizeTopic(
  topicName: string,
  headlines: string[],
  existing: MarketCategory[] = []
): MarketCategory[] {
  const text = `${topicName} ${headlines.join(" ")}`.toLowerCase();
  const matched = new Set<MarketCategory>(existing);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matched.add(category as MarketCategory);
        break;
      }
    }
  }

  if (matched.size === 0) matched.add("stock");
  return [...matched];
}

/* ── Extract a short topic key from a headline ────────  */

function extractTopicKey(item: AVFeedItem): string {
  if (item.ticker_sentiment.length > 0) {
    const top = item.ticker_sentiment[0];
    if (top.ticker && !top.ticker.startsWith("CRYPTO:")) {
      return top.ticker;
    }
    if (top.ticker?.startsWith("CRYPTO:")) {
      return top.ticker.replace("CRYPTO:", "");
    }
  }

  if (item.topics.length > 0) {
    const best = item.topics.reduce((a, b) =>
      parseFloat(b.relevance_score) > parseFloat(a.relevance_score) ? b : a
    );
    return best.topic;
  }

  const title = item.title
    .replace(/^breaking:?\s*/i, "")
    .replace(/^update:?\s*/i, "");
  const colon = title.indexOf(":");
  if (colon > 0 && colon < 40) return title.substring(0, colon).trim();
  return title.split(/\s+/).slice(0, 5).join(" ");
}

/* ── Group AV articles into MarketAsset[] ──────────── */

function groupArticles(feed: AVFeedItem[]): MarketAsset[] {
  const topicMap = new Map<
    string,
    {
      headlines: string[];
      scores: number[];
      labels: string[];
      avTopics: AVTopicTag[];
      sources: Set<string>;
    }
  >();

  for (const item of feed) {
    const key = extractTopicKey(item).toLowerCase();
    let entry = topicMap.get(key);

    if (!entry) {
      entry = {
        headlines: [],
        scores: [],
        labels: [],
        avTopics: [],
        sources: new Set(),
      };
      topicMap.set(key, entry);
    }

    if (entry.headlines.length < MAX_HEADLINES_PER_TOPIC) {
      entry.headlines.push(item.title);
    }
    entry.scores.push(item.overall_sentiment_score);
    entry.labels.push(item.overall_sentiment_label);
    entry.avTopics.push(...item.topics);
    entry.sources.add(item.source_domain);
  }

  return [...topicMap.entries()]
    .map(([key, data]) => {
      const avgScore =
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      const avCategories = mapAvTopics(data.avTopics);
      const categories = categorizeTopic(key, data.headlines, avCategories);
      const sentiment = mapSentiment(data.labels[0] ?? "Neutral", avgScore);
      const primarySource = [...data.sources][0] ?? "alphavantage.co";

      return {
        topic: formatTopicName(key),
        count: data.headlines.length,
        sentiment,
        sentimentScore: Math.round(avgScore * 100) / 100,
        recentHeadlines: data.headlines,
        categories,
        source: primarySource,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function formatTopicName(key: string): string {
  if (key.length <= 6 && key === key.toUpperCase()) return key;
  return key
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ── Fetch from Alpha Vantage News Sentiment API ─────── */

async function fetchAlphaVantage(): Promise<AVFeedItem[]> {
  const apiKey = process.env["ALPHA_VANTAGE_API_KEY"];
  if (!apiKey) {
    log.error("ALPHA_VANTAGE_API_KEY not set");
    return [];
  }

  const batchSize = ALPHA_VANTAGE_API.TOPICS_PER_BATCH;
  const batches: string[][] = [];
  for (let i = 0; i < ALPHA_VANTAGE_API.TOPICS.length; i += batchSize) {
    batches.push(ALPHA_VANTAGE_API.TOPICS.slice(i, i + batchSize));
  }

  const allItems: AVFeedItem[] = [];

  for (const batch of batches) {
    const topicsParam = batch.join(",");
    const url =
      `${ALPHA_VANTAGE_API.ENDPOINT}?function=${ALPHA_VANTAGE_API.FUNCTION}` +
      `&topics=${topicsParam}&sort=LATEST&limit=${ALPHA_VANTAGE_API.LIMIT}` +
      `&apikey=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        log.warn(
          { status: res.status, batch: topicsParam },
          "AV batch HTTP error"
        );
        continue;
      }

      const json = (await res.json()) as AVResponse;

      if (json.Information) {
        log.warn(
          { info: json.Information },
          "Alpha Vantage rate-limit hit, stopping"
        );
        break;
      }
      if (json["Error Message"]) {
        log.error({ error: json["Error Message"] }, "Alpha Vantage error");
        continue;
      }

      const items = json.feed ?? [];
      allItems.push(...items);
      log.info({ batch: topicsParam, items: items.length }, "AV batch fetched");
    } catch (error) {
      clearTimeout(timeout);
      log.error({ error, batch: topicsParam }, "AV batch fetch failed");
    }
  }

  return allItems;
}

/* ── Deduplicate articles across batches ──────────────── */

function deduplicateFeed(items: AVFeedItem[]): AVFeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

/* ── Main public API ─────────────────────────────────── */

export async function fetchMarketData(): Promise<MarketResponse | null> {
  try {
    log.info("Fetching assets data from Alpha Vantage...");

    const feed = await fetchAlphaVantage();

    const uniqueFeed = deduplicateFeed(feed);

    if (uniqueFeed.length === 0) {
      log.warn("No articles from Alpha Vantage, using fallback");
      return getFallbackMarket();
    }

    const assets = groupArticles(uniqueFeed);
    const totalArticles = assets.reduce((s, t) => s + t.count, 0);

    const data: MarketResponse = {
      assets,
      timeWindow: "24h",
      articlesAnalyzed: totalArticles,
      fetchedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(data);

    await Promise.all([
      redisCache.put(ALPHA_VANTAGE_API.CACHE_KEY, json, {
        expirationTtl: ALPHA_VANTAGE_API.CACHE_TTL,
      }),
      redisCache.put(ALPHA_VANTAGE_API.FALLBACK_KEY, json, {
        expirationTtl: ALPHA_VANTAGE_API.FALLBACK_TTL,
      }),
    ]);

    log.info(
      { topics: assets.length, articles: totalArticles },
      "Market data cached from Alpha Vantage"
    );

    return data;
  } catch (error) {
    log.error({ error }, "Error fetching assets data");
    return getFallbackMarket();
  }
}

export async function getCachedMarket(): Promise<MarketResponse | null> {
  const cached = await redisCache.get(ALPHA_VANTAGE_API.CACHE_KEY);
  if (cached) return JSON.parse(cached) as MarketResponse;
  return null;
}

export async function getFallbackMarket(): Promise<MarketResponse | null> {
  const fallback = await redisCache.get(ALPHA_VANTAGE_API.FALLBACK_KEY);
  if (fallback) {
    log.info("Serving assets data from fallback cache");
    return JSON.parse(fallback) as MarketResponse;
  }
  return null;
}
