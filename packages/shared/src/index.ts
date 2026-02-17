/**
 * Neptu Types - Balinese Wuku Calendar System
 * "Your Balinese Soul, On-Chain"
 */

// ============================================================================
// Base Types
// ============================================================================

export interface WukuItem {
  value: number;
  name: string;
  urip?: number;
  gender?: string;
}

export interface SaptaWara extends WukuItem {
  urip: number;
  gender: string;
}

export interface PancaWara extends WukuItem {
  urip: number;
  gender: string;
}

export interface SadWara extends WukuItem {
  urip: number;
  gender: string;
}

export interface Wuku extends WukuItem {
  urip: number;
}

export interface TriWara extends WukuItem {}
export interface CaturWara extends WukuItem {}
export interface Cipta extends WukuItem {}
export interface Rasa extends WukuItem {}
export interface Karsa extends WukuItem {}
export interface Tindakan extends WukuItem {}
export interface DasaAksara extends WukuItem {}
export interface Frekuensi extends WukuItem {}
export interface KandaPat extends WukuItem {}
export interface PancaBrahma extends WukuItem {}
export interface PancaTirta extends WukuItem {}
export interface Steps extends WukuItem {}

export interface LahirUntuk {
  name: string;
  description: string;
}

export interface Afirmasi {
  pattern: string;
  name: string;
}

// ============================================================================
// Database Schema
// ============================================================================

export interface NeptuDatabase {
  sapta_wara: SaptaWara[];
  panca_wara: PancaWara[];
  sad_wara: SadWara[];
  wuku: Wuku[];
  tri_wara: TriWara[];
  catur_wara: CaturWara[];
  cipta: Cipta[];
  rasa: Rasa[];
  karsa: Karsa[];
  tindakan: Tindakan[];
  mitra_satru_ning_dina: Frekuensi[];
  mitra_satru_peluang: Frekuensi[];
  kanda_pat: KandaPat[];
  steps: Steps[];
  panca_tirta: PancaTirta[];
  panca_brahma: PancaBrahma[];
  dasa_aksara: DasaAksara[];
  lahir_untuk: LahirUntuk[];
  afirmasi: {
    gender_patterns: Afirmasi[];
  };
}

// ============================================================================
// Reading Types
// ============================================================================

export interface BaseReading {
  date: string;
  sapta_wara: SaptaWara;
  panca_wara: PancaWara;
  wuku: Wuku;
  sad_wara: SadWara;
  total_urip: number;
  full_urip: number;
  c24_urip: number;
  dasa_aksara: DasaAksara;
  panca_brahma: PancaBrahma;
  panca_tirta: PancaTirta;
  frekuensi: Frekuensi;
  gender_pattern: string;
  biner: number;
  dualitas: "YIN" | "YANG";
  siklus: Steps;
  kanda_pat: KandaPat;
  cipta: Cipta;
  rasa: Rasa;
  karsa: Karsa;
  tindakan: Tindakan;
}

export interface Potensi extends BaseReading {
  afirmasi: Afirmasi;
  lahir_untuk: LahirUntuk;
}

export interface Peluang extends BaseReading {
  afirmasi: Afirmasi;
  diberi_hak_untuk: LahirUntuk;
}

export interface FullReading {
  potensi: Potensi;
  peluang: Peluang;
}

// ============================================================================
// Compatibility Types (Mitra Satru)
// ============================================================================

export type MitraSatruCategory = "mitra" | "neutral" | "satru";

export interface DimensionComparison {
  dimension: string;
  person1Value: string;
  person2Value: string;
  isMatch: boolean;
}

export interface CompatibilityResult {
  person1: Potensi;
  person2: Potensi;
  mitraSatru: {
    person1Frekuensi: Frekuensi;
    person2Frekuensi: Frekuensi;
    combinedFrekuensi: Frekuensi;
    category: MitraSatruCategory;
    description: string;
  };
  dimensions: DimensionComparison[];
  scores: {
    frekuensi: number;
    cycles: number;
    traits: number;
    overall: number;
  };
}

export interface CompatibilityPair {
  personA: number;
  personB: number;
  result: CompatibilityResult;
}

export const MIN_COMPATIBILITY_PEOPLE = 2 as const;
export const MAX_COMPATIBILITY_PEOPLE = 5 as const;

// ============================================================================
// NFT Metadata Types (Solana)
// ============================================================================

export interface NeptuSoulAttribute {
  trait_type: string;
  value: string | number;
  display_type?: "number" | "date";
}

export interface NeptuSoulMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  attributes: NeptuSoulAttribute[];
}

// ============================================================================
// Blockchain Types
// ============================================================================

export type ChainType = "solana" | "evm";
export type NetworkType = "localnet" | "devnet" | "mainnet";

export interface ChainNetwork {
  name: string;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl: string;
  chainId?: number;
}

export interface ChainConfig {
  type: ChainType;
  networks: Record<NetworkType, ChainNetwork>;
  defaultNetwork: NetworkType;
}

// ============================================================================
// Solana Network Configuration
// ============================================================================

export const SOLANA_NETWORKS: Record<NetworkType, ChainNetwork> = {
  localnet: {
    name: "Localnet",
    rpcUrl: "http://localhost:8899",
    wsUrl: "ws://localhost:8900",
    explorerUrl: "http://localhost:3000",
  },
  devnet: {
    name: "Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    wsUrl: "wss://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
  },
  mainnet: {
    name: "Mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    wsUrl: "wss://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
  },
} as const;

// ============================================================================
// EVM Network Configuration (Base L2)
// ============================================================================

export const EVM_NETWORKS: Record<NetworkType, ChainNetwork> = {
  localnet: {
    name: "Hardhat",
    rpcUrl: "http://localhost:8545",
    explorerUrl: "http://localhost:3000",
    chainId: 31337,
  },
  devnet: {
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    chainId: 84532,
  },
  mainnet: {
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    chainId: 8453,
  },
} as const;

// ============================================================================
// Chain Configuration
// ============================================================================

export const CHAIN_CONFIGS: Record<ChainType, ChainConfig> = {
  solana: {
    type: "solana",
    networks: SOLANA_NETWORKS,
    defaultNetwork: "devnet",
  },
  evm: {
    type: "evm",
    networks: EVM_NETWORKS,
    defaultNetwork: "devnet",
  },
} as const;

export const DEFAULT_CHAIN: ChainType = "solana";
export const DEFAULT_NETWORK: NetworkType = "devnet";

export function getNetworkConfig(
  chain: ChainType = DEFAULT_CHAIN,
  network: NetworkType = DEFAULT_NETWORK
): ChainNetwork {
  return CHAIN_CONFIGS[chain].networks[network];
}

// ============================================================================
// Token Constants
// ============================================================================

export const SOL_TOKEN = {
  SYMBOL: "SOL",
  NAME: "Solana",
  DECIMALS: 9,
} as const;

export const NEPTU_TOKEN = {
  SYMBOL: "NEPTU",
  NAME: "Neptu Token",
  DECIMALS: 6,
  TOTAL_SUPPLY: 1_000_000_000,
  REWARDS_POOL: 300_000_000,
  BURN_RATE: 0.5,
} as const;

export const SUDIGITAL_TOKEN = {
  SYMBOL: "SUDIGITAL",
  NAME: "SUDIGITAL Token",
  DECIMALS: 6,
  MINT: "7zsunv4pLAzVWGCQts2k266TYJuLJfMvHcMbcRSR8xqf",
} as const;

// ============================================================================
// Pricing Constants (in lamports for SOL, raw amount for NEPTU)
// ============================================================================

/** @deprecated Use SUBSCRIPTION_PLANS for new pricing model */
export const PRICING = {
  POTENSI: {
    SOL: 0.01,
    NEPTU: 10,
    SUDIGITAL: 10,
    NEPTU_REWARD: 10,
    SUDIGITAL_NEPTU_REWARD: 10,
  },
  PELUANG: {
    SOL: 0.001,
    NEPTU: 1,
    SUDIGITAL: 1,
    NEPTU_REWARD: 1,
    SUDIGITAL_NEPTU_REWARD: 1,
  },
  COMPATIBILITY: {
    SOL: 0.005,
    NEPTU: 5,
    SUDIGITAL: 5,
    NEPTU_REWARD: 5,
    SUDIGITAL_NEPTU_REWARD: 5,
  },
  AI_CHAT: {
    SOL: 0.002,
    NEPTU: 2,
    SUDIGITAL: 2,
    NEPTU_REWARD: 2,
    SUDIGITAL_NEPTU_REWARD: 2,
  },
} as const;

export type ReadingType = keyof typeof PRICING;
export type PaymentType = "sol" | "neptu" | "sudigital";
export type PaymentStatus = "pending" | "confirmed" | "failed";

// ============================================================================
// Subscription Plans
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  FREE: {
    key: "FREE" as const,
    SOL: 0,
    NEPTU: 0,
    SUDIGITAL: 0,
    calendarDays: 0, // today only
    aiFeedback: false,
    interest: false,
    aiChat: false,
  },
  WEEKLY: {
    key: "WEEKLY" as const,
    SOL: 0.005,
    NEPTU: 5,
    SUDIGITAL: 5,
    calendarDays: 7,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
  MONTHLY: {
    key: "MONTHLY" as const,
    SOL: 0.015,
    NEPTU: 15,
    SUDIGITAL: 15,
    calendarDays: 30,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
  YEARLY: {
    key: "YEARLY" as const,
    SOL: 0.1,
    NEPTU: 100,
    SUDIGITAL: 100,
    calendarDays: 365,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
} as const;

export const AI_CHAT_ADDON = {
  PER_MESSAGE: { SOL: 0.002, NEPTU: 2, SUDIGITAL: 2 },
  PACK_10: { SOL: 0.01, NEPTU: 10, SUDIGITAL: 10 },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

// ============================================================================
// API Constants
// ============================================================================

export const API_ENDPOINTS = {
  READING_POTENSI: "/api/reading/potensi",
  READING_PELUANG: "/api/reading/peluang",
  READING_COMPATIBILITY: "/api/reading/compatibility",
  PAYMENT_CREATE: "/api/payment/create",
  PAYMENT_VERIFY: "/api/payment/verify",
  USER_PROFILE: "/api/user/profile",
} as const;

// ============================================================================
// Date Format Constants
// ============================================================================

export const DATE_FORMAT = "YYYY-MM-DD";
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ============================================================================
// Cache TTL (in seconds)
// ============================================================================

export const CACHE_TTL = {
  DAILY_READING: 86400,
  USER_PROFILE: 3600,
  PAYMENT_STATUS: 60,
} as const;

// ============================================================================
// User Profile Constants
// ============================================================================

export const USER_INTERESTS = [
  "love",
  "career",
  "health",
  "finance",
  "family",
  "friendship",
  "intimacy",
  "spirituality",
  "mindfulness",
  "selfgrowth",
  "purpose",
  "balance",
  "creativity",
  "travel",
  "fitness",
  "education",
  "luck",
  "crypto",
] as const;

export type UserInterest = (typeof USER_INTERESTS)[number];

// ============================================================================
// Gamification Constants
// ============================================================================

export const GAMIFICATION_REWARDS = {
  DAILY_CHECK_IN: 0.1,
  STREAK_7_DAYS: 1,
  STREAK_30_DAYS: 5,
  STREAK_100_DAYS: 20,
  FIRST_READING: 5,
  REFERRAL_REWARD: 10,
  REFEREE_BONUS: 2,
  SOCIAL_SHARE: 0.5,
  AUSPICIOUS_MULTIPLIER: 2,
} as const;

export const STREAK_MILESTONES = {
  WEEK: 7,
  MONTH: 30,
  CENTURY: 100,
} as const;

export type RewardType =
  | "daily_check_in"
  | "streak_bonus"
  | "first_reading"
  | "referral"
  | "referee_bonus"
  | "social_share"
  | "auspicious_day"
  | "payment_reward";

export type RewardStatus = "pending" | "claimed" | "expired";

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

// ============================================================================
// Mitra Satru Constants
// ============================================================================

export const MITRA_SATRU_FREKUENSI = {
  PATI: 0,
  GURU: 1,
  RATU: 2,
  LARA: 3,
} as const;

export const MITRA_SATRU_DESCRIPTIONS: Record<string, string> = {
  GURU: "Tertuntun (Guided) — Most auspicious, learning and growth",
  RATU: "Dikuasai (Governed) — Structured, order and stability",
  LARA: "Terhalang (Obstructed) — Challenges that build resilience",
  PATI: "Batal (Voided) — Release, letting go, transformation",
} as const;

export const MITRA_SATRU_PAIRS: Record<
  string,
  Record<string, MitraSatruCategory>
> = {
  GURU: { GURU: "mitra", RATU: "mitra", LARA: "neutral", PATI: "satru" },
  RATU: { GURU: "mitra", RATU: "neutral", LARA: "satru", PATI: "neutral" },
  LARA: { GURU: "neutral", RATU: "satru", LARA: "neutral", PATI: "mitra" },
  PATI: { GURU: "satru", RATU: "neutral", LARA: "mitra", PATI: "satru" },
} as const;

export const COMPATIBILITY_SCORES = {
  FREKUENSI_WEIGHT: 40,
  CYCLES_WEIGHT: 30,
  TRAITS_WEIGHT: 30,
  MITRA_SCORE: 100,
  NEUTRAL_SCORE: 60,
  SATRU_SCORE: 20,
  MATCH_BONUS: 100,
  NO_MATCH: 0,
} as const;

export const ALIGNMENT_THRESHOLDS = {
  MAX_SCORE: 100,
  URIP_DIVISOR: 30,
  BULLISH: 70,
  BEARISH: 40,
  WUKU_MATCH_SCORE: 30,
  PANCA_MATCH_SCORE: 25,
  SAPTA_MATCH_SCORE: 25,
  DAY_ALIGNMENT_MOD: 20,
} as const;

// ============================================================================
// API Pricing Constants
// ============================================================================

export const API_SCOPES = [
  "neptu:read",
  "neptu:write",
  "neptu:ai",
  "neptu:admin",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export const API_TIERS = ["starter", "pro", "business", "enterprise"] as const;

export type ApiTier = (typeof API_TIERS)[number];

export const API_SUBSCRIPTION_STATUS = [
  "active",
  "paused",
  "cancelled",
  "expired",
] as const;

export type ApiSubscriptionStatus = (typeof API_SUBSCRIPTION_STATUS)[number];

export const API_BILLING_PERIOD = ["monthly", "yearly"] as const;

export type ApiBillingPeriod = (typeof API_BILLING_PERIOD)[number];

export const API_PAYMENT_METHODS = ["sol", "neptu", "sudigital"] as const;

export type ApiPaymentMethod = (typeof API_PAYMENT_METHODS)[number];

export const API_ENDPOINT_CREDITS = {
  BASIC_CALL: 1,
  AI_ORACLE_CALL: 10,
  AI_INTERPRETATION_CALL: 5,
  BATCH_CALL: 5,
} as const;

export const API_RATE_LIMITS = {
  STARTER: 60,
  PRO: 120,
  BUSINESS: 300,
  ENTERPRISE: 1000,
} as const;

export const API_PRICING_PLANS = {
  STARTER: {
    tier: "starter" as const,
    priceUsd: 7.5,
    priceSol: 0.05,
    priceNeptu: 50,
    basicCalls: 1000,
    aiCalls: 100,
    rateLimit: 60,
    discountPercent: 0,
  },
  PRO: {
    tier: "pro" as const,
    priceUsd: 60,
    priceSol: 0.4,
    priceNeptu: 400,
    basicCalls: 10000,
    aiCalls: 1000,
    rateLimit: 120,
    discountPercent: 20,
  },
  BUSINESS: {
    tier: "business" as const,
    priceUsd: 450,
    priceSol: 3,
    priceNeptu: 3000,
    basicCalls: 100000,
    aiCalls: 10000,
    rateLimit: 300,
    discountPercent: 40,
  },
  ENTERPRISE: {
    tier: "enterprise" as const,
    priceUsd: 0,
    priceSol: 0,
    priceNeptu: 0,
    basicCalls: -1,
    aiCalls: -1,
    rateLimit: 1000,
    discountPercent: 0,
  },
} as const;

export const API_CREDIT_PACKS = {
  STARTER: {
    credits: 500,
    aiCredits: 50,
    priceUsd: 7.5,
    priceSol: 0.05,
    priceNeptu: 50,
    bonusPercent: 0,
  },
  GROWTH: {
    credits: 5000,
    aiCredits: 500,
    priceUsd: 60,
    priceSol: 0.4,
    priceNeptu: 400,
    bonusPercent: 10,
  },
  SCALE: {
    credits: 50000,
    aiCredits: 5000,
    priceUsd: 450,
    priceSol: 3,
    priceNeptu: 3000,
    bonusPercent: 20,
  },
} as const;

export const API_OVERAGE_RATES = {
  BASIC_CALL_NEPTU: 0.1,
  BASIC_CALL_SOL: 0.0001,
  AI_CALL_NEPTU: 1,
  AI_CALL_SOL: 0.001,
} as const;

// ============================================================================
// Authentication
// ============================================================================

/** Access token TTL in seconds (15 minutes) */
export const AUTH_ACCESS_TOKEN_TTL = 900 as const;

/** Refresh token TTL in seconds (7 days) */
export const AUTH_REFRESH_TOKEN_TTL = 604800 as const;

/** Nonce TTL in seconds (5 minutes) */
export const AUTH_NONCE_TTL = 300 as const;

/** Authorization header name */
export const AUTH_HEADER = "Authorization" as const;

/** Nonce message template — {nonce} is replaced with the generated nonce */
export const AUTH_NONCE_MESSAGE =
  "Sign this message to verify your wallet ownership for Neptu.\n\nNonce: {nonce}" as const;
