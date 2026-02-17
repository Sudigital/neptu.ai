import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const authApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

interface NonceResponse {
  success: boolean;
  nonce: string;
  message: string;
}

interface VerifyResponse {
  success: boolean;
  user: {
    id: string;
    walletAddress: string;
    displayName: string | null;
    onboarded: boolean;
    isAdmin: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

/**
 * Request a nonce for wallet signature authentication.
 */
export async function requestNonce(
  walletAddress: string
): Promise<NonceResponse> {
  const { data } = await authApi.post<NonceResponse>("/api/auth/nonce", {
    walletAddress,
  });
  return data;
}

/**
 * Verify a signed nonce and receive PASETO tokens.
 */
export async function verifySignature(
  walletAddress: string,
  signature: string
): Promise<VerifyResponse> {
  const { data } = await authApi.post<VerifyResponse>("/api/auth/verify", {
    walletAddress,
    signature,
  });
  return data;
}

/**
 * Refresh the token pair using a valid refresh token.
 */
export async function refreshTokens(
  refreshToken: string
): Promise<RefreshResponse> {
  const { data } = await authApi.post<RefreshResponse>("/api/auth/refresh", {
    refreshToken,
  });
  return data;
}
