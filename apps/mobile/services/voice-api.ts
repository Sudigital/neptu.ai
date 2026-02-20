import type {
  TranscribeResponse,
  SynthesizeResponse,
  VoiceOracleResponse,
  WalletBalance,
  SubscriptionInfo,
  UserProfile,
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
 * Base fetch helper — sends Bearer token from /auth/session.
 * Wallet address is embedded in the signed token, never sent as a raw header.
 */
async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

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
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (errorBody as { error?: string }).error ?? `Request failed: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
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
export async function getUserReading(
  walletAddress: string,
  targetDate?: string
) {
  const params = targetDate ? `?targetDate=${targetDate}` : "";
  return fetchApi(`/api/v1/users/${walletAddress}/reading${params}`);
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
// Payment — same as web
// ============================================================================

export async function buildPaymentTx(
  walletAddress: string,
  readingType: string,
  paymentType: "sol" | "neptu" | "sudigital"
) {
  return fetchApi(`/api/v1/pay/${paymentType}/build`, {
    method: "POST",
    body: JSON.stringify({ walletAddress, readingType }),
  });
}

// ============================================================================
// Voice API — mobile-only (web doesn't do voice)
// ============================================================================

// POST /api/voice/transcribe — audio → text
export async function transcribeAudio(
  audioUri: string,
  language: string
): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: "audio/wav",
    name: "recording.wav",
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
  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: "audio/wav",
    name: "recording.wav",
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
