// Navigation
export type Screen = "connect" | "onboarding" | "main";
export type MainTab = "home" | "calendar" | "ar" | "wallet" | "profile";
export type ARView =
  | "list"
  | "aura"
  | "orb"
  | "garden"
  | "mandala"
  | "tokenRain"
  | "guardian";

// Theme
export type ThemeMode = "dark" | "light";

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
  rewardEarned?: number;
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

// Conversation history entry
export interface ConversationEntry {
  id: string;
  timestamp: number;
  transcript: string;
  response: string;
  language: string;
}

// Payment build response from /pay/:type/build
export interface PaymentBuildResponse {
  success: boolean;
  instruction: {
    programId: string;
    accounts: Array<{
      address: string;
      role: number;
    }>;
    data: number[];
  };
  transaction: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
  pricing: {
    solAmount: number;
    neptuReward?: number;
    neptuAmount?: number;
    burnAmount?: number;
  };
}

// Payment verification response
export interface PaymentVerifyResponse {
  success: boolean;
  transactionId?: string;
  rewardAmount?: number;
  error?: string;
}

// Reward info from API
export interface RewardInfo {
  id: string;
  rewardType: string;
  neptuAmount: string;
  description: string;
  status: string;
  createdAt: string;
}

// Streak info from API
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  totalCheckIns: number;
}

// Habit tracking
export type HabitFrequency = "daily" | "weekly" | "custom";
export type HabitCategory =
  | "health"
  | "mindfulness"
  | "fitness"
  | "learning"
  | "finance"
  | "social"
  | "creativity"
  | "spiritual";

export const HABIT_ICONS: Record<HabitCategory, string> = {
  health: "💧",
  mindfulness: "🧘",
  fitness: "🏋️",
  learning: "📖",
  finance: "💰",
  social: "👥",
  creativity: "🎨",
  spiritual: "🔮",
};

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetCount: number;
  scheduledTime: string | null;
  daysOfWeek: number[];
  tokenReward: number;
  createdAt: string;
  isArchived: boolean;
}

export interface HabitCompletion {
  habitId: string;
  date: string;
  count: number;
  completedAt: string;
}

export interface HabitWithProgress extends Habit {
  todayCount: number;
  isCompletedToday: boolean;
  currentStreak: number;
}

// Wuku guidance for habits
export interface WukuDayGuidance {
  wukuName: string;
  saptaWara: string;
  rpiasa: string;
  focusArea: string;
  guidance: string;
  recommendedCategories: HabitCategory[];
}
