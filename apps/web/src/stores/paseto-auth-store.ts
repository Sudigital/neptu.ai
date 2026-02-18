import {
  AUTH_ACCESS_TOKEN_TTL,
  AUTH_REFRESH_TOKEN_TTL,
  type UserRole,
} from "@neptu/shared";
import { create } from "zustand";

// ============================================================================
// Types
// ============================================================================

interface AuthUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  onboarded: boolean;
  role: UserRole;
}

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
}

interface PasetoAuthState {
  user: AuthUser | null;
  tokens: TokenState;
  isAuthenticated: boolean;
  isSigningIn: boolean;

  /** Store tokens + user after successful verification */
  setSession: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string
  ) => void;

  /** Update tokens after refresh */
  setTokens: (accessToken: string, refreshToken: string) => void;

  /** Clear session (logout) */
  clearSession: () => void;

  /** Get current access token (returns null if expired) */
  getAccessToken: () => string | null;

  /** Check if access token needs refresh */
  needsRefresh: () => boolean;

  /** Track PASETO signing in progress */
  setSigningIn: (value: boolean) => void;
}

// ============================================================================
// Persistence keys
// ============================================================================

const STORAGE_KEY = "neptu_auth";

interface PersistedAuth {
  user: AuthUser | null;
  tokens: TokenState;
}

function loadPersistedAuth(): PersistedAuth {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { user: null, tokens: emptyTokens() };

    const parsed = JSON.parse(stored) as PersistedAuth;

    // Clear stale sessions where both tokens are expired
    const now = Date.now();
    const refreshExpired =
      !parsed.tokens.refreshTokenExpiresAt ||
      now > parsed.tokens.refreshTokenExpiresAt;
    const accessExpired =
      !parsed.tokens.accessTokenExpiresAt ||
      now > parsed.tokens.accessTokenExpiresAt;

    if (refreshExpired && accessExpired) {
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, tokens: emptyTokens() };
    }

    return parsed;
  } catch {
    return { user: null, tokens: emptyTokens() };
  }
}

function persistAuth(data: PersistedAuth): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be full or unavailable
  }
}

function clearPersistedAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

function emptyTokens(): TokenState {
  return {
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  };
}

// ============================================================================
// Store
// ============================================================================

const persisted = loadPersistedAuth();

// Session is valid if access token exists OR refresh token is still valid
function isSessionValid(tokens: TokenState): boolean {
  if (tokens.accessToken) return true;
  if (
    tokens.refreshToken &&
    tokens.refreshTokenExpiresAt &&
    Date.now() < tokens.refreshTokenExpiresAt
  )
    return true;
  return false;
}

export const usePasetoAuthStore = create<PasetoAuthState>()((set, get) => ({
  user: persisted.user,
  tokens: persisted.tokens,
  isAuthenticated: isSessionValid(persisted.tokens),
  isSigningIn: false,

  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => {
    const now = Date.now();
    const tokens: TokenState = {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: now + AUTH_ACCESS_TOKEN_TTL * 1000,
      refreshTokenExpiresAt: now + AUTH_REFRESH_TOKEN_TTL * 1000,
    };
    persistAuth({ user, tokens });
    set({ user, tokens, isAuthenticated: true });
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    const now = Date.now();
    const tokens: TokenState = {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: now + AUTH_ACCESS_TOKEN_TTL * 1000,
      refreshTokenExpiresAt: now + AUTH_REFRESH_TOKEN_TTL * 1000,
    };
    const user = get().user;
    persistAuth({ user, tokens });
    set({ tokens, isAuthenticated: true });
  },

  clearSession: () => {
    clearPersistedAuth();
    set({
      user: null,
      tokens: emptyTokens(),
      isAuthenticated: false,
      isSigningIn: false,
    });
  },

  setSigningIn: (value: boolean) => set({ isSigningIn: value }),

  getAccessToken: () => {
    const { tokens } = get();
    if (!tokens.accessToken || !tokens.accessTokenExpiresAt) return null;
    // Consider expired 30s early to avoid edge-case failures
    if (Date.now() > tokens.accessTokenExpiresAt - 30_000) return null;
    return tokens.accessToken;
  },

  needsRefresh: () => {
    const { tokens } = get();
    if (!tokens.refreshToken || !tokens.refreshTokenExpiresAt) return false;
    if (Date.now() > tokens.refreshTokenExpiresAt) return false;
    // Access token expired or about to expire
    if (!tokens.accessTokenExpiresAt) return true;
    return Date.now() > tokens.accessTokenExpiresAt - 60_000;
  },
}));
