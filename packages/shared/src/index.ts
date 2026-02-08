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
  network: NetworkType = DEFAULT_NETWORK,
): ChainNetwork {
  return CHAIN_CONFIGS[chain].networks[network];
}

// ============================================================================
// Token Constants
// ============================================================================

export const NEPTU_TOKEN = {
  SYMBOL: "NEPTU",
  NAME: "Neptu Token",
  DECIMALS: 6,
  TOTAL_SUPPLY: 1_000_000_000,
  REWARDS_POOL: 300_000_000,
  BURN_RATE: 0.5,
} as const;

// ============================================================================
// Pricing Constants (in lamports for SOL, raw amount for NEPTU)
// ============================================================================

/** @deprecated Use SUBSCRIPTION_PLANS for new pricing model */
export const PRICING = {
  POTENSI: {
    SOL: 0.01,
    NEPTU: 10,
    NEPTU_REWARD: 10,
  },
  PELUANG: {
    SOL: 0.001,
    NEPTU: 1,
    NEPTU_REWARD: 1,
  },
  COMPATIBILITY: {
    SOL: 0.005,
    NEPTU: 5,
    NEPTU_REWARD: 5,
  },
  AI_CHAT: {
    SOL: 0.002,
    NEPTU: 2,
    NEPTU_REWARD: 2,
  },
} as const;

export type ReadingType = keyof typeof PRICING;
export type PaymentType = "sol" | "neptu";
export type PaymentStatus = "pending" | "confirmed" | "failed";

// ============================================================================
// Subscription Plans
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  FREE: {
    key: "FREE" as const,
    SOL: 0,
    NEPTU: 0,
    calendarDays: 0, // today only
    aiFeedback: false,
    interest: false,
    aiChat: false,
  },
  WEEKLY: {
    key: "WEEKLY" as const,
    SOL: 0.005,
    NEPTU: 5,
    calendarDays: 7,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
  MONTHLY: {
    key: "MONTHLY" as const,
    SOL: 0.015,
    NEPTU: 15,
    calendarDays: 30,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
  YEARLY: {
    key: "YEARLY" as const,
    SOL: 0.1,
    NEPTU: 100,
    calendarDays: 365,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
} as const;

export const AI_CHAT_ADDON = {
  PER_MESSAGE: { SOL: 0.002, NEPTU: 2 },
  PACK_10: { SOL: 0.01, NEPTU: 10 },
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
  "career",
  "love",
  "health",
  "spirituality",
  "finance",
  "family",
  "travel",
  "creativity",
  "education",
  "relationships",
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
