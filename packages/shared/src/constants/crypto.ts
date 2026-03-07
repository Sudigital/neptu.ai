// ============================================================================
// Crypto Market Constants
// ============================================================================

export interface CryptoCoinConfig {
  symbol: string;
  name: string;
  birthday: string;
  description: string;
  image: string;
  coingeckoId: string;
}

export const TOP_CRYPTO_COINS: CryptoCoinConfig[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    birthday: "2009-01-03",
    description: "The original cryptocurrency, digital gold",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    coingeckoId: "bitcoin",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    birthday: "2015-07-30",
    description: "Smart contract platform, DeFi backbone",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    coingeckoId: "ethereum",
  },
  {
    symbol: "USDT",
    name: "Tether",
    birthday: "2014-10-06",
    description: "Largest stablecoin, USD-pegged",
    image: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    coingeckoId: "tether",
  },
  {
    symbol: "BNB",
    name: "BNB",
    birthday: "2017-07-08",
    description: "Binance ecosystem token",
    image:
      "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    coingeckoId: "binancecoin",
  },
  {
    symbol: "XRP",
    name: "XRP",
    birthday: "2012-06-02",
    description: "Cross-border payments, banking bridge",
    image:
      "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    coingeckoId: "ripple",
  },
  {
    symbol: "USDC",
    name: "USDC",
    birthday: "2018-09-26",
    description: "Circle stablecoin, regulated USD-pegged",
    image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
    coingeckoId: "usd-coin",
  },
  {
    symbol: "SOL",
    name: "Solana",
    birthday: "2020-03-16",
    description: "High-speed blockchain, meme coin hub",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    coingeckoId: "solana",
  },
  {
    symbol: "TRX",
    name: "TRON",
    birthday: "2018-07-25",
    description: "Entertainment-focused blockchain",
    image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
    coingeckoId: "tron",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    birthday: "2013-12-08",
    description: "The people's crypto, meme legend",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    coingeckoId: "dogecoin",
  },
  {
    symbol: "BCH",
    name: "Bitcoin Cash",
    birthday: "2017-08-01",
    description: "Bitcoin fork, peer-to-peer cash",
    image:
      "https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png",
    coingeckoId: "bitcoin-cash",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    birthday: "2017-09-27",
    description: "Research-driven blockchain",
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    coingeckoId: "cardano",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    birthday: "2017-09-16",
    description: "Oracle network, real-world data",
    image:
      "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
    coingeckoId: "chainlink",
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    birthday: "2020-09-23",
    description: "Fast finality, subnet architecture",
    image:
      "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
    coingeckoId: "avalanche-2",
  },
] as const;

// ── CoinGecko API ────────────────────────────────────

export const COINGECKO_API = {
  BASE_URL: "https://api.coingecko.com/api/v3",
  MARKETS_ENDPOINT: "/coins/markets",
  CHART_ENDPOINT: "/coins/{id}/market_chart",
  VS_CURRENCY: "usd",
  PER_PAGE: 20,
  ALLOWED_CHART_DAYS: ["7", "30", "90", "365"] as const,
} as const;

export type ChartDays = (typeof COINGECKO_API.ALLOWED_CHART_DAYS)[number];

export const CHART_CACHE_TTL: Record<string, number> = {
  "7": 600,
  "30": 3600,
  "90": 7200,
  "365": 21600,
} as const;

export const COSMIC_MESSAGES: Record<string, string> = {
  Sinta: "New beginnings favor this coin's energy today",
  Landep: "Sharp insights guide trading decisions",
  Ukir: "Creative energy supports growth potential",
  Kulantir: "Stability and patience rewarded",
  Tolu: "Balance between risk and opportunity",
  Gumbreg: "Hidden value may surface unexpectedly",
  Wariga: "Wisdom of the ancients protects value",
  Warigadian: "Double blessings amplify gains",
  Julungwangi: "Golden opportunities emerge",
  Sungsang: "Reversal energy - expect the unexpected",
  Dungulan: "Steady accumulation favored",
  Kuningan: "Blessed prosperity cycle active",
  Langkir: "Spiritual alignment enhances luck",
  Medangsia: "Market forces align favorably",
  Pujut: "Transformation energy present",
  Pahang: "Protective forces active",
  Krulut: "Interconnected gains possible",
  Merakih: "Calculated risks may pay off",
  Tambir: "Foundation building period",
  Medangkungan: "Leadership energy dominant",
  Matal: "Eye-opening revelations ahead",
  Uye: "Renewal cycle approaching",
  Menail: "Stability through change",
  Perangbakat: "Hidden talents emerge",
  Bala: "Strength in adversity",
  Ugu: "Auspicious timing for action",
  Wayang: "Shadow plays - look beneath surface",
  Klawu: "Cloud cover lifts soon",
  Dukut: "Grass-roots growth continues",
  Watugunung: "Mountain strength supports value",
} as const;

export const COSMIC_DEFAULT_MESSAGE = "Cosmic forces are in motion";

// ============================================================================
// External Market API Constants
// ============================================================================

export const FEAR_GREED_API = {
  URL: "https://api.alternative.me/fng/",
  CACHE_TTL: 3600,
  HISTORY_LIMIT: 30,
} as const;

export const DERIVATIVES_API = {
  /** Preferred CCXT exchange id (Binance USD-M futures) */
  EXCHANGE: "binanceusdm",
  /** Default trading pair (CCXT unified symbol format) */
  DEFAULT_SYMBOL: "BTC/USDT:USDT",
  /** Cache TTL in seconds */
  CACHE_TTL: 300,
} as const;

export const FUNDING_RATE_THRESHOLDS = {
  OVERLEVERAGED_LONG: 0.03,
  OVERLEVERAGED_SHORT: -0.01,
} as const;

export const FORBES_WEALTH_FLOW_API = {
  URL: "https://www.forbes.com/forbesapi/person/rtb/0/position/true.json",
  LIMIT: 50,
  CACHE_TTL: 1800,
  TOP_MOVERS_COUNT: 3,
  WORTH_DIVISOR: 1000,
} as const;

// ============================================================================
// Billionaire Tracking Constants
// ============================================================================

export const BILLIONAIRE_TRACKING = {
  /** Forbes API limit for daily snapshot */
  FORBES_LIMIT: 66,
  /** Max Neptu score (for normalisation) */
  MAX_SCORE: 100,
  /** Max urip value for percentage calc */
  MAX_URIP: 42,
  /** Max prosperity level */
  MAX_PROSPERITY_LEVEL: 8,
  /** Neptu Alpha weights */
  WEIGHT_PROSPERITY: 0.3,
  WEIGHT_DAILY_ENERGY: 0.3,
  WEIGHT_URIP_PELUANG: 0.2,
  WEIGHT_COMPATIBILITY: 0.2,
  /** User-Agent for Forbes */
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
} as const;

export const CORS_ALLOWED_ORIGINS = [
  "https://neptu.day",
  "https://neptu-web-production.pages.dev",
  "http://localhost:3001",
  "http://localhost:3000",
] as const;
