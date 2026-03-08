import type { Peluang, Potensi } from "@neptu/shared";

import type {
  TranscribeResponse,
  SynthesizeResponse,
  VoiceOracleResponse,
  WalletBalance,
  SubscriptionInfo,
  UserProfile,
  PaymentBuildResponse,
  PaymentVerifyResponse,
  RewardInfo,
  StreakInfo,
} from "../types";

import { API_URL } from "../constants";

// Wallet address set after MWA connect
let currentWallet: string | null = null;
// Access token obtained from /auth/session after wallet connect
let accessToken: string | null = null;

export function setWalletAddress(address: string | null) {
  currentWallet = address;
}

export function getWalletAddress(): string | null {
  return currentWallet;
}

/**
 * Authenticate with the API after MWA wallet connect.
 * Calls /auth/session to get a signed access token for this wallet.
 */
export async function authenticateWallet(walletAddress: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });

  if (!res.ok) {
    throw new Error("Failed to authenticate wallet with API");
  }

  const data = (await res.json()) as {
    success: boolean;
    accessToken: string;
  };
  accessToken = data.accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

/**
 * Ensure we have a valid access token.
 * If token is missing and wallet is set, retry authentication.
 */
async function ensureAuthenticated(): Promise<void> {
  if (accessToken) return;
  if (!currentWallet) {
    throw new Error("Wallet not connected. Please reconnect.");
  }
  await authenticateWallet(currentWallet);
}

/**
 * Base fetch helper — sends Bearer token from /auth/session.
 * Wallet address is embedded in the signed token, never sent as a raw header.
 */
export async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  await ensureAuthenticated();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // If 401, token might have expired — retry auth once
  if (res.status === 401 && currentWallet) {
    accessToken = null;
    await ensureAuthenticated();
    const retryHeaders = { ...headers };
    if (accessToken) {
      retryHeaders.Authorization = `Bearer ${accessToken}`;
    }
    const retry = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: retryHeaders,
    });
    if (!retry.ok) {
      const body = await retry
        .json()
        .catch(() => ({ error: retry.statusText }));
      throw new Error(
        (body as { error?: string }).error ?? `Request failed: ${retry.status}`
      );
    }
    return retry.json() as Promise<T>;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (body as { error?: string }).error ?? `Request failed: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch without Content-Type (for multipart/form-data)
 */
async function fetchMultipart<T>(path: string, body: FormData): Promise<T> {
  await ensureAuthenticated();

  const headers: Record<string, string> = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    // If 401, token expired — retry auth once
    if (res.status === 401 && currentWallet) {
      accessToken = null;
      await ensureAuthenticated();
      const retryHeaders: Record<string, string> = {};
      if (accessToken) {
        retryHeaders.Authorization = `Bearer ${accessToken}`;
      }
      const retry = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: retryHeaders,
        body,
        signal: controller.signal,
      });
      if (!retry.ok) {
        const errorBody = await retry
          .json()
          .catch(() => ({ error: retry.statusText }));
        const msg =
          (errorBody as { error?: string }).error ??
          `Request failed: ${retry.status}`;
        throw new Error(msg);
      }
      return retry.json() as Promise<T>;
    }

    if (!res.ok) {
      const errorBody = await res
        .json()
        .catch(() => ({ error: res.statusText }));
      const msg =
        (errorBody as { error?: string }).error ??
        `Request failed: ${res.status}`;
      throw new Error(msg);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================================
// User API — same endpoints as web (single source of truth)
// ============================================================================

// POST /api/users — get or create user
export async function getOrCreateUser(
  walletAddress: string
): Promise<{ success: boolean; user: UserProfile }> {
  return fetchApi("/api/v1/users", {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
}

// GET /api/users/:walletAddress — get user profile
export async function getUserProfile(
  walletAddress: string
): Promise<{ success: boolean; user: UserProfile }> {
  return fetchApi(`/api/v1/users/${walletAddress}`);
}

// POST /api/users/:walletAddress/onboard — complete onboarding
export async function onboardUser(
  walletAddress: string,
  payload: {
    birthDate: string;
    displayName?: string;
    interests?: string[];
    preferredLanguage?: string;
  }
): Promise<{ success: boolean; user: UserProfile }> {
  return fetchApi(`/api/v1/users/${walletAddress}/onboard`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUT /api/users/:walletAddress — update profile
export async function updateUserProfile(
  walletAddress: string,
  payload: {
    displayName?: string;
    email?: string;
    interests?: string[];
    birthDate?: string;
    preferredLanguage?: string;
  }
): Promise<{ success: boolean; user: UserProfile }> {
  return fetchApi(`/api/v1/users/${walletAddress}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// GET /api/users/:walletAddress/reading — get reading
export interface ReadingApiResponse {
  success: boolean;
  reading?: {
    potensi: Potensi | null;
    peluang: Peluang;
    full: Record<string, unknown>;
    date: string;
  };
  requiresBirthDate?: boolean;
}

export async function getUserReading(
  walletAddress: string,
  targetDate?: string
): Promise<ReadingApiResponse> {
  const params = targetDate ? `?targetDate=${targetDate}` : "";
  return fetchApi<ReadingApiResponse>(
    `/api/v1/users/${walletAddress}/reading${params}`
  );
}

// ============================================================================
// Wallet API — same as web
// ============================================================================

// GET /api/wallet/balances/:walletAddress
export async function getWalletBalances(walletAddress: string): Promise<
  {
    success: boolean;
  } & WalletBalance
> {
  return fetchApi(`/api/v1/wallet/balances/${walletAddress}`);
}

// ============================================================================
// Reading API — same as web
// ============================================================================

export async function getPotensi(date: string) {
  return fetchApi(`/api/v1/reading/potensi?date=${date}`);
}

export async function getPeluang(date: string, targetDate?: string) {
  const target = targetDate ?? new Date().toISOString().split("T")[0];
  return fetchApi(`/api/v1/reading/peluang?date=${date}&targetDate=${target}`);
}

// ============================================================================
// Subscription / Pricing
// ============================================================================

export async function getSubscription(
  walletAddress: string
): Promise<SubscriptionInfo> {
  try {
    return await fetchApi(`/api/v1/pricing/subscription/${walletAddress}`);
  } catch {
    return {
      plan: "FREE",
      freeConversationsUsed: 0,
      freeConversationsLimit: 5,
    };
  }
}

// ============================================================================
// Gamification — daily check-in, streaks, rewards (same as web)
// ============================================================================

export async function getStreakInfo(walletAddress: string): Promise<{
  success: boolean;
  streak: StreakInfo | null;
  hasCheckedInToday: boolean;
}> {
  return fetchApi(`/api/v1/wallet/streak/${walletAddress}`);
}

export async function dailyCheckIn(walletAddress: string): Promise<{
  success: boolean;
  streak: StreakInfo;
  dailyRewardGranted: boolean;
  streakBonusGranted: boolean;
  streakBonusAmount: number;
}> {
  return fetchApi(`/api/v1/wallet/check-in/${walletAddress}`, {
    method: "POST",
  });
}

export async function getPendingRewards(
  walletAddress: string
): Promise<{ success: boolean; rewards: RewardInfo[]; totalPending: number }> {
  return fetchApi(`/api/v1/wallet/rewards/${walletAddress}`);
}

export async function claimReward(
  walletAddress: string,
  rewardId: string,
  claimTxSignature: string
): Promise<{ success: boolean; reward?: RewardInfo }> {
  return fetchApi(`/api/v1/wallet/claim/${walletAddress}`, {
    method: "POST",
    body: JSON.stringify({ rewardId, claimTxSignature }),
  });
}

// ============================================================================
// Payment — same as web
// ============================================================================

export async function buildPaymentTx(
  walletAddress: string,
  readingType: string,
  paymentType: "sol" | "neptu" | "sudigital"
): Promise<PaymentBuildResponse> {
  return fetchApi(`/api/v1/pay/${paymentType}/build`, {
    method: "POST",
    body: JSON.stringify({ walletAddress, readingType }),
  });
}

export async function verifyPayment(
  walletAddress: string,
  txSignature: string,
  readingType: string,
  paymentType: "sol" | "neptu" | "sudigital"
): Promise<PaymentVerifyResponse> {
  return fetchApi("/api/v1/token/verify-payment", {
    method: "POST",
    body: JSON.stringify({
      walletAddress,
      txSignature,
      readingType,
      paymentType,
    }),
  });
}

// ============================================================================
// Voice API — mobile-only (web doesn't do voice)
// ============================================================================

// Detect audio MIME type from file URI
function getAudioMime(uri: string): { type: string; name: string } {
  if (uri.endsWith(".m4a") || uri.endsWith(".mp4")) {
    return { type: "audio/mp4", name: "recording.m4a" };
  }
  if (uri.endsWith(".aac")) {
    return { type: "audio/aac", name: "recording.aac" };
  }
  return { type: "audio/wav", name: "recording.wav" };
}

// POST /api/voice/transcribe — audio → text
export async function transcribeAudio(
  audioUri: string,
  language: string
): Promise<TranscribeResponse> {
  const mime = getAudioMime(audioUri);
  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: mime.type,
    name: mime.name,
  } as unknown as Blob);
  formData.append("language", language);

  return fetchMultipart("/api/v1/voice/transcribe", formData);
}

// POST /api/voice/oracle — full voice conversation
// birthDate + language fetched from user profile on the server
export async function voiceOracle(
  audioUri: string,
  language?: string
): Promise<VoiceOracleResponse> {
  const mime = getAudioMime(audioUri);
  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: mime.type,
    name: mime.name,
  } as unknown as Blob);
  if (language) {
    formData.append("language", language);
  }

  return fetchMultipart("/api/v1/voice/oracle", formData);
}

// POST /api/voice/synthesize — text → speech
export async function synthesize(
  text: string,
  language: string,
  voice?: string
): Promise<SynthesizeResponse> {
  return fetchApi("/api/v1/voice/synthesize", {
    method: "POST",
    body: JSON.stringify({ text, language, voice }),
  });
}

// ============================================================================
// Oracle API — text-only AI oracle (no TTS)
// ============================================================================

export interface OracleTextResponse {
  success: boolean;
  message: string;
  cached: boolean;
}

export async function askOracle(
  question: string,
  birthDate: string,
  targetDate?: string,
  language?: string
): Promise<OracleTextResponse> {
  return fetchApi<OracleTextResponse>("/api/v1/reading/oracle", {
    method: "POST",
    body: JSON.stringify({
      question,
      birthDate,
      targetDate,
      language: language || "en",
    }),
  });
}
