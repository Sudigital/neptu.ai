/**
 * Colosseum Agent Hackathon Module
 * Exports all Colosseum-related functionality
 */

export { ColosseumClient } from "./client";
export type {
  ColosseumEnv,
  AgentStatus,
  ForumPost,
  ForumComment,
  Project,
  LeaderboardEntry,
  Poll,
  ClawKeyVerifyResponse,
  ClawKeyStatus,
} from "./client";

export { ForumAgent } from "./forum-agent";
export type { ForumAgentEnv } from "./forum-agent";

export { HeartbeatScheduler } from "./heartbeat";
export type {
  HeartbeatEnv,
  HeartbeatResult,
  HeartbeatPhase,
} from "./heartbeat";

// Crypto market data
export {
  fetchAndStoreCryptoMarketData,
  getCryptoWithMarketData,
  fetchCoinGeckoMarketData,
  getCoinGeckoIds,
  getCoinGeckoId,
  type CryptoWithMarketData,
} from "./crypto-market-fetcher";

export {
  TOP_CRYPTO_COINS,
  getCoinBySymbol,
  getAllCoins,
} from "./crypto-birthdays";
export type { CryptoCoin } from "./crypto-birthdays";
