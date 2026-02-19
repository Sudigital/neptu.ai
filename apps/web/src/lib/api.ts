import type {
  CompatibilityPair,
  CompatibilityResult,
  RewardType,
} from "@neptu/shared";

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
 * Set signed access token as Bearer header for all API requests.
 */
export function setBearerToken(token: string) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

/** Whether a signed session token has been set. */
export function hasAuthToken(): boolean {
  return !!api.defaults.headers.common.Authorization;
}

/**
 * Clear the Authorization header (on logout).
 */
export function clearAuthToken() {
  delete api.defaults.headers.common.Authorization;
}

/**
 * Authenticate wallet with the API via /auth/session.
 * Returns signed PASETO access + refresh tokens.
 */
export async function authenticateSession(
  walletAddress: string
): Promise<string> {
  const { data } = await axios.post<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
  }>(`${API_URL}/api/v1/auth/session`, { walletAddress });

  setBearerToken(data.accessToken);
  return data.accessToken;
}

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
  preferredLanguage: string;
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
      "/api/v1/users",
      { walletAddress, ...(email ? { email } : {}) }
    );
    return data;
  },

  // Get user by wallet
  async getUser(walletAddress: string) {
    const { data } = await api.get<{ success: boolean; user: User }>(
      `/api/v1/users/${walletAddress}`
    );
    return data;
  },

  // Onboard user with birth date, interests, and display name
  async onboardUser(
    walletAddress: string,
    payload: { birthDate: string; displayName?: string; interests?: string[] }
  ) {
    const { data } = await api.post<{ success: boolean; user: User }>(
      `/api/v1/users/${walletAddress}/onboard`,
      payload
    );
    return data;
  },

  // Update user profile (displayName, interests, birthDate, preferredLanguage)
  async updateProfile(
    walletAddress: string,
    payload: {
      displayName?: string;
      email?: string;
      interests?: string[];
      birthDate?: string;
      preferredLanguage?: string;
    }
  ) {
    const { data } = await api.put<{ success: boolean; user: User }>(
      `/api/v1/users/${walletAddress}`,
      payload
    );
    return data;
  },

  // Get user's reading for a specific date (defaults to today)
  async getReading(walletAddress: string, targetDate?: string) {
    const { data } = await api.get<UserReadingResponse>(
      `/api/v1/users/${walletAddress}/reading`,
      { params: targetDate ? { targetDate } : undefined }
    );
    return data;
  },

  // Get reading history
  async getReadingHistory(walletAddress: string, limit = 10) {
    const { data } = await api.get<{ success: boolean; readings: unknown[] }>(
      `/api/v1/users/${walletAddress}/readings`,
      { params: { limit } }
    );
    return data;
  },

  // Get reading for specific date (without user)
  async getPotensi(birthDate: string) {
    const { data } = await api.get("/api/v1/reading/potensi", {
      params: { date: birthDate },
    });
    return data;
  },

  async getPeluang(birthDate: string, targetDate?: string) {
    const { data } = await api.get("/api/v1/reading/peluang", {
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
    }>("/api/v1/oracle", {
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
    }>(`/api/v1/oracle/daily/${birthDate}?language=${language || "en"}`);
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
    }>("/api/v1/oracle/interpret", {
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
    }>("/api/v1/oracle/compatibility", {
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
    }>(`/api/v1/wallet/balance/${walletAddress}`);
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
    }>(`/api/v1/wallet/balances/${walletAddress}`);
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
    }>(`/api/v1/wallet/rewards/${walletAddress}`);
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
    }>(`/api/v1/wallet/streak/${walletAddress}`);
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
    }>(`/api/v1/wallet/check-in/${walletAddress}`);
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
    }>(`/api/v1/wallet/claim/${walletAddress}`, { rewardId, claimTxSignature });
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
    }>("/api/v1/pay/claim/build", {
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
    }>(`/api/v1/token/transactions/${walletAddress}`, { params });
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
    }>(`/api/v1/token/stats/${walletAddress}`);
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
    }>("/api/v1/reading/compatibility", { birthDate1, birthDate2 });
    return data;
  },

  // Compatibility Batch - Calculate Mitra Satru for all pairwise combinations
  async getCompatibilityBatch(birthDates: string[]) {
    const { data } = await api.post<{
      success: boolean;
      type: "compatibility";
      birthDates: string[];
      pairs: CompatibilityPair[];
    }>("/api/v1/reading/compatibility/batch", { birthDates });
    return data;
  },
};
