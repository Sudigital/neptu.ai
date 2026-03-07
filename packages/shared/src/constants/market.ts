// ============================================================================
// Market Intelligence — Alpha Vantage News Sentiment (single source)
// Only tradeable assets: Crypto (CEX/DEX), Stocks (exchanges), Forex
// ============================================================================

export const ALPHA_VANTAGE_API = {
  ENDPOINT: "https://www.alphavantage.co/query",
  FUNCTION: "NEWS_SENTIMENT",
  CACHE_KEY: "market:latest",
  CACHE_TTL: 7200,
  FALLBACK_KEY: "market:fallback",
  FALLBACK_TTL: 86400,
  CRON_PATTERN: "0 */2 * * *",
  LIMIT: 50,
  TOPICS_PER_BATCH: 4,
  TOPICS: [
    "blockchain",
    "earnings",
    "financial_markets",
    "economy_monetary",
    "economy_macro",
    "technology",
  ],
} as const;

/* ── Asset Categories (tradeable only) ───────────────── */

export const MARKET_CATEGORIES = ["crypto", "forex", "stock"] as const;

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export const MARKET_CATEGORY_CONFIG: Record<
  MarketCategory,
  { label: string; color: string; icon: string }
> = {
  crypto: { label: "Crypto", color: "#f59e0b", icon: "bitcoin" },
  forex: { label: "Forex", color: "#3b82f6", icon: "currency" },
  stock: { label: "Stock", color: "#8b5cf6", icon: "bar-chart" },
} as const;

export const AV_TOPIC_MAP: Record<string, MarketCategory[]> = {
  blockchain: ["crypto"],
  earnings: ["stock"],
  ipo: ["stock"],
  mergers_and_acquisitions: ["stock"],
  financial_markets: ["stock"],
  economy_fiscal: ["forex"],
  economy_monetary: ["forex"],
  economy_macro: ["forex"],
  finance: ["stock"],
  retail_wholesale: ["stock"],
  technology: ["stock"],
} as const;

/* ── Keyword rules for asset classification ──────────── */

export const CATEGORY_KEYWORDS: Record<MarketCategory, string[]> = {
  crypto: [
    "bitcoin",
    "btc",
    "ethereum",
    "eth",
    "crypto",
    "blockchain",
    "defi",
    "nft",
    "solana",
    "xrp",
    "binance",
    "coinbase",
    "stablecoin",
    "altcoin",
    "mining",
    "halving",
    "web3",
    "token",
    "wallet",
    "dex",
    "cex",
    "uniswap",
    "raydium",
  ],
  forex: [
    "forex",
    "currency",
    "dollar",
    "usd",
    "eur",
    "gbp",
    "jpy",
    "yuan",
    "exchange rate",
    "fx",
    "carry trade",
    "central bank",
    "yen",
    "pound",
    "euro",
    "swiss franc",
    "fed",
    "ecb",
    "boj",
    "interest rate",
    "monetary policy",
  ],
  stock: [
    "stock",
    "equity",
    "s&p",
    "nasdaq",
    "dow jones",
    "ipo",
    "earnings",
    "dividend",
    "share",
    "market cap",
    "bull market",
    "bear market",
    "wall street",
    "nyse",
    "index fund",
    "etf",
    "rally",
    "sell-off",
    "apple",
    "google",
    "microsoft",
    "nvidia",
    "tesla",
    "amazon",
    "meta",
  ],
};

/* ── Sentiment ───────────────────────────────────────── */

export const MARKET_SENTIMENTS = ["bullish", "bearish", "neutral"] as const;

export type MarketSentiment = (typeof MARKET_SENTIMENTS)[number];

export interface MarketAsset {
  topic: string;
  count: number;
  sentiment: MarketSentiment;
  sentimentScore?: number;
  recentHeadlines: string[];
  categories?: MarketCategory[];
  source?: string;
}

export interface MarketResponse {
  assets: MarketAsset[];
  timeWindow: string;
  articlesAnalyzed: number;
  fetchedAt: string;
}

export const SENTIMENT_CONFIG: Record<
  MarketSentiment,
  { label: string; color: string; icon: string; weight: number }
> = {
  bullish: {
    label: "Bullish",
    color: "#22c55e",
    icon: "trending-up",
    weight: 1,
  },
  bearish: {
    label: "Bearish",
    color: "#ef4444",
    icon: "trending-down",
    weight: -1,
  },
  neutral: { label: "Neutral", color: "#eab308", icon: "minus", weight: 0 },
} as const;

export const TOPIC_TO_CRYPTO_MAP: Record<string, string> = {
  Bitcoin: "BTC",
  Ethereum: "ETH",
  XRP: "XRP",
  Solana: "SOL",
  Binance: "BNB",
  Polygon: "MATIC",
  DeFi: "DeFi",
  AI: "AI",
  ETF: "ETF",
} as const;

/* ── Exchange Listing Info ────────────────────────────── */

export type ExchangeType = "cex" | "dex" | "exchange";

export interface ExchangeListing {
  symbol: string;
  type: ExchangeType;
  venue: string;
  color: string;
}

export const EXCHANGE_LISTINGS: Record<string, ExchangeListing[]> = {
  BTC: [
    { symbol: "BTC", type: "cex", venue: "Binance", color: "#f0b90b" },
    { symbol: "BTC", type: "cex", venue: "Coinbase", color: "#0052ff" },
    { symbol: "BTC", type: "dex", venue: "Uniswap", color: "#ff007a" },
  ],
  ETH: [
    { symbol: "ETH", type: "cex", venue: "Binance", color: "#f0b90b" },
    { symbol: "ETH", type: "cex", venue: "Coinbase", color: "#0052ff" },
    { symbol: "ETH", type: "dex", venue: "Uniswap", color: "#ff007a" },
    { symbol: "ETH", type: "dex", venue: "Raydium", color: "#2bdbbd" },
  ],
  SOL: [
    { symbol: "SOL", type: "cex", venue: "Binance", color: "#f0b90b" },
    { symbol: "SOL", type: "dex", venue: "Raydium", color: "#2bdbbd" },
    { symbol: "SOL", type: "dex", venue: "Jupiter", color: "#c7f284" },
  ],
  XRP: [
    { symbol: "XRP", type: "cex", venue: "Binance", color: "#f0b90b" },
    { symbol: "XRP", type: "cex", venue: "Upbit", color: "#094eff" },
  ],
  BNB: [
    { symbol: "BNB", type: "cex", venue: "Binance", color: "#f0b90b" },
    { symbol: "BNB", type: "dex", venue: "PancakeSwap", color: "#633001" },
  ],
  MATIC: [
    { symbol: "MATIC", type: "cex", venue: "Binance", color: "#f0b90b" },
    { symbol: "MATIC", type: "dex", venue: "Uniswap", color: "#ff007a" },
  ],
  AAPL: [
    { symbol: "AAPL", type: "exchange", venue: "NASDAQ", color: "#0096d6" },
  ],
  GOOGL: [
    { symbol: "GOOGL", type: "exchange", venue: "NASDAQ", color: "#0096d6" },
  ],
  MSFT: [
    { symbol: "MSFT", type: "exchange", venue: "NASDAQ", color: "#0096d6" },
  ],
  TSLA: [
    { symbol: "TSLA", type: "exchange", venue: "NASDAQ", color: "#0096d6" },
  ],
  NVDA: [
    { symbol: "NVDA", type: "exchange", venue: "NASDAQ", color: "#0096d6" },
  ],
} as const;

export const EXCHANGE_TYPE_LABELS: Record<ExchangeType, string> = {
  cex: "CEX",
  dex: "DEX",
  exchange: "Exchange",
} as const;

export const EXCHANGE_TYPE_COLORS: Record<ExchangeType, string> = {
  cex: "#3b82f6",
  dex: "#8b5cf6",
  exchange: "#059669",
} as const;

export const TOPIC_TO_STOCK_MAP: Record<string, string> = {
  Apple: "AAPL",
  Google: "GOOGL",
  Microsoft: "MSFT",
  Tesla: "TSLA",
  Nvidia: "NVDA",
  Amazon: "AMZN",
  Meta: "META",
} as const;

/* ── Investment Thresholds ───────────────────────────── */

export const INVESTMENT_THRESHOLDS = {
  STRONG_BUY: 75,
  BUY: 60,
  NEUTRAL: 40,
  SELL: 25,
} as const;

export const INVESTMENT_SIGNALS = [
  "strong_buy",
  "buy",
  "neutral",
  "sell",
  "strong_sell",
] as const;

export type InvestmentSignal = (typeof INVESTMENT_SIGNALS)[number];
