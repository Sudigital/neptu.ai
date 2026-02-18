// ============================================================================
// Crypto Market Constants
// ============================================================================

export interface CryptoCoinConfig {
  symbol: string;
  name: string;
  birthday: string;
  description: string;
}

export const TOP_CRYPTO_COINS: CryptoCoinConfig[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    birthday: "2009-01-03",
    description: "The original cryptocurrency, digital gold",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    birthday: "2015-07-30",
    description: "Smart contract platform, DeFi backbone",
  },
  {
    symbol: "USDT",
    name: "Tether",
    birthday: "2014-10-06",
    description: "Largest stablecoin, USD-pegged",
  },
  {
    symbol: "BNB",
    name: "BNB",
    birthday: "2017-07-08",
    description: "Binance ecosystem token",
  },
  {
    symbol: "XRP",
    name: "XRP",
    birthday: "2012-06-02",
    description: "Cross-border payments, banking bridge",
  },
  {
    symbol: "USDC",
    name: "USDC",
    birthday: "2018-09-26",
    description: "Circle stablecoin, regulated USD-pegged",
  },
  {
    symbol: "SOL",
    name: "Solana",
    birthday: "2020-03-16",
    description: "High-speed blockchain, meme coin hub",
  },
  {
    symbol: "TRX",
    name: "TRON",
    birthday: "2018-07-25",
    description: "Entertainment-focused blockchain",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    birthday: "2013-12-08",
    description: "The people's crypto, meme legend",
  },
  {
    symbol: "BCH",
    name: "Bitcoin Cash",
    birthday: "2017-08-01",
    description: "Bitcoin fork, peer-to-peer cash",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    birthday: "2017-09-27",
    description: "Research-driven blockchain",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    birthday: "2017-09-16",
    description: "Oracle network, real-world data",
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    birthday: "2020-09-23",
    description: "Fast finality, subnet architecture",
  },
] as const;

export const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  XRP: "ripple",
  USDC: "usd-coin",
  SOL: "solana",
  TRX: "tron",
  DOGE: "dogecoin",
  BCH: "bitcoin-cash",
  ADA: "cardano",
  LINK: "chainlink",
  AVAX: "avalanche-2",
} as const;

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

export const CORS_ALLOWED_ORIGINS = [
  "https://neptu.sudigital.com",
  "https://neptu-web-production.pages.dev",
  "http://localhost:3001",
  "http://localhost:3000",
] as const;
