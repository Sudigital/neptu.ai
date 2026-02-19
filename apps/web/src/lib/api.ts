import type {
  CompatibilityPair,
  CompatibilityResult,
  RewardType,
} from "@neptu/shared";

import { WALLET_HEADER } from "@neptu/shared";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Set the wallet address header for all API requests.
 * Wallet ownership is verified client-side by Dynamic SDK.
 */
export function setWalletHeader(walletAddress: string) {
  api.defaults.headers.common[WALLET_HEADER] = walletAddress;
}

/**
 * Clear the wallet header (on logout).
 */
export function clearAuthToken() {
  delete api.defaults.headers.common[WALLET_HEADER];
}

// Web app uses Dynamic SDK session (connect-only) with wallet header auth.
// PASETO is reserved for developer/external API access only.

const workerApi = axios.create({
  baseURL: WORKER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface User {
  id: string;
  walletAddress: string;
  birthDate: string | null;
  displayName: string | null;
  interests: string[] | null;
  onboarded: boolean;
  role: string;
  email: string | null;
  createdAt: string;
}

// Wuku cycle types (matching wariga package)
interface WukuItem {
  value: number;
  name: string;
  urip: number;
}

interface SaptaWara extends WukuItem {
  gender: string;
}

interface PancaWara extends WukuItem {
  gender: string;
}

type Wuku = WukuItem;

interface SadWara extends WukuItem {
  gender: string;
}

interface Frekuensi {
  value: number;
  name: string;
  description: string;
}

interface LahirUntuk {
  name: string;
  description: string;
}

interface Afirmasi {
  pattern: string;
  name: string;
}

interface NamedItem {
  value: number;
  name: string;
}

interface Potensi {
  date: string;
  sapta_wara: SaptaWara;
  panca_wara: PancaWara;
  wuku: Wuku;
  sad_wara: SadWara;
  total_urip: number;
  full_urip: number;
  c24_urip: number;
  frekuensi: Frekuensi;
  gender_pattern: string;
  biner: number;
  dualitas: string;
  afirmasi: Afirmasi;
  lahir_untuk: LahirUntuk;
  tindakan: NamedItem;
  cipta: NamedItem;
  rasa: NamedItem;
  karsa: NamedItem;
  siklus: NamedItem;
  kanda_pat: NamedItem;
  [key: string]: unknown;
}

interface Peluang {
  date: string;
  sapta_wara: SaptaWara;
  panca_wara: PancaWara;
  wuku: Wuku;
  sad_wara: SadWara;
  total_urip: number;
  full_urip: number;
  c24_urip: number;
  frekuensi: Frekuensi;
  gender_pattern: string;
  biner: number;
  dualitas: string;
  afirmasi: Afirmasi;
  diberi_hak_untuk: LahirUntuk;
  tindakan: NamedItem;
  cipta: NamedItem;
  rasa: NamedItem;
  karsa: NamedItem;
  siklus: NamedItem;
  kanda_pat: NamedItem;
  [key: string]: unknown;
}

interface Reading {
  potensi: Potensi;
  peluang: Peluang;
  full: Record<string, unknown>;
  date: string;
}

interface UserReadingResponse {
  success: boolean;
  user: {
    walletAddress: string;
    birthDate: string;
  };
  reading: Reading;
}

export const neptuApi = {
  // Get or create user
  async getOrCreateUser(walletAddress: string, email?: string) {
    const { data } = await api.post<{ success: boolean; user: User }>(
      "/api/users",
      { walletAddress, ...(email ? { email } : {}) }
    );
    return data;
  },

  // Get user by wallet
  async getUser(walletAddress: string) {
    const { data } = await api.get<{ success: boolean; user: User }>(
      `/api/users/${walletAddress}`
    );
    return data;
  },

  // Onboard user with birth date, interests, and display name
  async onboardUser(
    walletAddress: string,
    payload: { birthDate: string; displayName?: string; interests?: string[] }
  ) {
    const { data } = await api.post<{ success: boolean; user: User }>(
      `/api/users/${walletAddress}/onboard`,
      payload
    );
    return data;
  },

  // Update user profile (displayName, interests, birthDate)
  async updateProfile(
    walletAddress: string,
    payload: {
      displayName?: string;
      email?: string;
      interests?: string[];
      birthDate?: string;
    }
  ) {
    const { data } = await api.put<{ success: boolean; user: User }>(
      `/api/users/${walletAddress}`,
      payload
    );
    return data;
  },

  // Get user's reading for a specific date (defaults to today)
  async getReading(walletAddress: string, targetDate?: string) {
    const { data } = await api.get<UserReadingResponse>(
      `/api/users/${walletAddress}/reading`,
      { params: targetDate ? { targetDate } : undefined }
    );
    return data;
  },

  // Get reading history
  async getReadingHistory(walletAddress: string, limit = 10) {
    const { data } = await api.get<{ success: boolean; readings: unknown[] }>(
      `/api/users/${walletAddress}/readings`,
      { params: { limit } }
    );
    return data;
  },

  // Get reading for specific date (without user)
  async getPotensi(birthDate: string) {
    const { data } = await api.get("/api/reading/potensi", {
      params: { date: birthDate },
    });
    return data;
  },

  async getPeluang(birthDate: string, targetDate?: string) {
    const { data } = await api.get("/api/reading/peluang", {
      params: {
        date: birthDate,
        targetDate: targetDate || new Date().toISOString().split("T")[0],
      },
    });
    return data;
  },

  // AI Oracle - Ask a question about reading
  async askOracle(
    question: string,
    birthDate: string,
    targetDate?: string,
    language?: string
  ) {
    const { data } = await workerApi.post<{
      success: boolean;
      message: string;
      cached: boolean;
      tokensUsed?: number;
    }>("/api/oracle", {
      question,
      birthDate,
      targetDate,
      language: language || "en",
    });
    return data;
  },

  // AI Oracle - Get daily interpretation
  async getDailyInterpretation(birthDate: string, language?: string) {
    const { data } = await workerApi.get<{
      success: boolean;
      date: string;
      message: string;
      cached: boolean;
    }>(`/api/oracle/daily/${birthDate}?language=${language || "en"}`);
    return data;
  },

  // AI Oracle - Get interpretation for a specific date
  async getDateInterpretation(
    birthDate: string,
    targetDate: string,
    language?: string
  ) {
    const { data } = await workerApi.post<{
      success: boolean;
      interpretation: string;
      date: string;
      cached: boolean;
    }>("/api/oracle/interpret", {
      birthDate,
      targetDate,
      language: language || "en",
    });
    return data;
  },

  // AI Oracle - Get compatibility interpretation
  async getCompatibilityInterpretation(
    birthDate1: string,
    birthDate2: string,
    language?: string
  ) {
    const { data } = await workerApi.post<{
      success: boolean;
      message: string;
      cached: boolean;
      tokensUsed?: number;
    }>("/api/oracle/compatibility", {
      birthDate1,
      birthDate2,
      language: language || "en",
    });
    return data;
  },

  // Wallet - Get token balance
  async getTokenBalance(walletAddress: string) {
    const { data } = await api.get<{
      success: boolean;
      balance: { raw: string; formatted: number };
      pendingRewards: number;
    }>(`/api/wallet/balance/${walletAddress}`);
    return data;
  },

  // Wallet - Get SOL + NEPTU balances
  async getWalletBalances(walletAddress: string) {
    const { data } = await api.get<{
      success: boolean;
      sol: { lamports: string; formatted: number };
      neptu: { raw: string; formatted: number };
      sudigital: { raw: string; formatted: number };
      pendingRewards: number;
    }>(`/api/wallet/balances/${walletAddress}`);
    return data;
  },

  // Wallet - Get pending rewards
  async getPendingRewards(walletAddress: string) {
    const { data } = await api.get<{
      success: boolean;
      rewards: Array<{
        id: string;
        rewardType: RewardType;
        neptuAmount: number;
        description: string;
        status: string;
        createdAt: string;
        expiresAt: string | null;
      }>;
      totalPending: number;
    }>(`/api/wallet/rewards/${walletAddress}`);
    return data;
  },

  // Wallet - Get streak info
  async getStreakInfo(walletAddress: string) {
    const { data } = await api.get<{
      success: boolean;
      streak: {
        id: string;
        userId: string;
        currentStreak: number;
        longestStreak: number;
        lastCheckIn: string | null;
        totalCheckIns: number;
      } | null;
      hasCheckedInToday: boolean;
    }>(`/api/wallet/streak/${walletAddress}`);
    return data;
  },

  // Wallet - Perform check-in
  async checkIn(walletAddress: string) {
    const { data } = await api.post<{
      success: boolean;
      streak: {
        id: string;
        userId: string;
        currentStreak: number;
        longestStreak: number;
        lastCheckIn: string | null;
        totalCheckIns: number;
      };
      dailyRewardGranted: boolean;
      streakBonusGranted: boolean;
      streakBonusAmount: number;
    }>(`/api/wallet/check-in/${walletAddress}`);
    return data;
  },

  // Wallet - Claim reward
  async claimReward(
    walletAddress: string,
    rewardId: string,
    claimTxSignature: string
  ) {
    const { data } = await api.post<{
      success: boolean;
      reward: {
        id: string;
        rewardType: string;
        neptuAmount: number;
        status: string;
        claimedAt: string;
        claimTxSignature: string;
      };
    }>(`/api/wallet/claim/${walletAddress}`, { rewardId, claimTxSignature });
    return data;
  },

  // Payment - Build claim rewards transaction
  async buildClaimInstruction(
    walletAddress: string,
    amount: number,
    nonce: number,
    blockhash?: string,
    lastValidBlockHeight?: number
  ) {
    const { data } = await api.post<{
      success: boolean;
      serializedTransaction: number[];
      transaction: {
        blockhash: string;
        lastValidBlockHeight: number;
      };
      claim: {
        amount: number;
        nonce: number;
      };
    }>("/api/pay/claim/build", {
      walletAddress,
      amount,
      nonce,
      blockhash,
      lastValidBlockHeight,
    });
    return data;
  },

  // Token - Get transaction history
  async getTransactions(
    walletAddress: string,
    params?: {
      limit?: number;
      offset?: number;
      transactionType?: string;
    }
  ) {
    const { data } = await api.get<{
      success: boolean;
      transactions: Array<{
        id: string;
        txSignature: string | null;
        transactionType: string;
        readingType: string | null;
        solAmount: number | null;
        neptuAmount: number | null;
        neptuRewarded: number | null;
        neptuBurned: number | null;
        status: string;
        createdAt: string;
        confirmedAt: string | null;
        description?: string | null;
      }>;
    }>(`/api/token/transactions/${walletAddress}`, { params });
    return data;
  },

  // Token - Get token stats
  async getTokenStats(walletAddress: string) {
    const { data } = await api.get<{
      success: boolean;
      stats: {
        totalSolSpent: number;
        totalNeptuRewarded: number;
        totalNeptuBurned: number;
        transactionCount: number;
      };
    }>(`/api/token/stats/${walletAddress}`);
    // Normalize field names for the UI
    return {
      ...data,
      stats: data.stats
        ? {
            totalSolSpent: data.stats.totalSolSpent,
            totalNeptuEarned: data.stats.totalNeptuRewarded,
            totalNeptuBurned: data.stats.totalNeptuBurned,
            totalTransactions: data.stats.transactionCount,
          }
        : null,
    };
  },

  // Compatibility - Calculate Mitra Satru between two birth dates
  async getCompatibility(birthDate1: string, birthDate2: string) {
    const { data } = await api.post<{
      success: boolean;
      type: "compatibility";
      birthDate1: string;
      birthDate2: string;
      reading: CompatibilityResult;
    }>("/api/reading/compatibility", { birthDate1, birthDate2 });
    return data;
  },

  // Compatibility Batch - Calculate Mitra Satru for all pairwise combinations
  async getCompatibilityBatch(birthDates: string[]) {
    const { data } = await api.post<{
      success: boolean;
      type: "compatibility";
      birthDates: string[];
      pairs: CompatibilityPair[];
    }>("/api/reading/compatibility/batch", { birthDates });
    return data;
  },
};
