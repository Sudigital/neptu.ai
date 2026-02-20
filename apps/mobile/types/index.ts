// Navigation
export type Screen = "connect" | "onboarding" | "oracle";

// Orb states
export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";

// User profile (matches API UserDTO - single source of truth)
export interface UserProfile {
  id: string;
  walletAddress: string;
  email: string | null;
  displayName: string | null;
  birthDate: string | null;
  preferredLanguage: string;
  interests: string[];
  onboarded: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Voice oracle request/response
export interface VoiceOracleRequest {
  audio: Blob;
  language?: string;
}

export interface VoiceOracleResponse {
  success: boolean;
  transcript: string;
  response: string;
  audioBase64: string | null;
  audioContentType: string;
  cached: boolean;
  tokensUsed?: number;
}

// Voice transcription
export interface TranscribeResponse {
  text: string;
  language: string;
  confidence: number;
}

// Voice synthesis
export interface SynthesizeRequest {
  text: string;
  language: string;
  voice?: string;
}

export interface SynthesizeResponse {
  success: boolean;
  audioBase64: string;
  audioContentType: string;
  durationMs: number;
}

// Wallet balance (matches web API shape)
export interface WalletBalance {
  sol: { lamports: string; formatted: number };
  neptu: { raw: string; formatted: number };
  sudigital: { raw: string; formatted: number };
}

// Subscription info
export interface SubscriptionInfo {
  plan: "FREE" | "WEEKLY" | "MONTHLY" | "YEARLY";
  expiresAt?: string;
  freeConversationsUsed: number;
  freeConversationsLimit: number;
}

// Audio amplitude data for visualizer
export interface AmplitudeData {
  amplitude: number;
  timestamp: number;
}

// Language option
export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  voice: string;
  locale: string;
}
