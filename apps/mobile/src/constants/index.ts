import type { NetworkType } from "@neptu/shared";

import { SOLANA_NETWORKS, DEFAULT_NETWORK } from "@neptu/shared";

// API — adb reverse tcp:3000 forwards phone localhost to host machine
const API_BASE_URL_DEV = "http://localhost:3000";
const API_BASE_URL_PROD = "https://api.neptu.day";

export const API_URL = __DEV__ ? API_BASE_URL_DEV : API_BASE_URL_PROD;

// Solana
export const SOLANA_NETWORK: NetworkType = DEFAULT_NETWORK;
export const SOLANA_RPC_URL = SOLANA_NETWORKS[SOLANA_NETWORK].rpcUrl;
export const SOLANA_CLUSTER =
  SOLANA_NETWORK === "mainnet" ? "mainnet-beta" : SOLANA_NETWORK;

// Voice
export const FREE_DAILY_CONVERSATIONS = 100;
export const MAX_RECORDING_DURATION_MS = 30_000;
export const SILENCE_TIMEOUT_MS = 2_000;
export const AUDIO_SAMPLE_RATE = 16_000;

// Audio processing
export const AMPLITUDE_HISTORY_SIZE = 60;
export const SILENCE_THRESHOLD = 0.1;
export const METERING_INTERVAL_MS = 100;
export const METERING_DB_OFFSET = 60;
export const INITIAL_SILENCE_DELAY_MS = 2_000;
export const SIMULATED_AMPLITUDE_BASE = 0.3;
export const SIMULATED_AMPLITUDE_RANGE = 0.5;

// Animation
export const ORB_SIZE = 200;
export const ORB_IDLE_SCALE = 1;
export const ORB_IDLE_PULSE_SCALE = 1.03;
export const ORB_LISTENING_SCALE_MIN = 0.95;
export const ORB_LISTENING_SCALE_MAX = 1.15;
export const ORB_LISTENING_SPRING_DAMPING = 15;
export const ORB_LISTENING_SPRING_STIFFNESS = 200;
export const ORB_LISTENING_GLOW_BASE = 20;
export const ORB_LISTENING_GLOW_RANGE = 40;
export const ORB_THINKING_SCALE = 1.05;
export const ORB_THINKING_DURATION = 1_000;
export const ORB_THINKING_ROTATION = 360;
export const ORB_THINKING_ROTATION_SPEED = 3_000;
export const ORB_THINKING_GLOW = 50;
export const ORB_SPEAKING_AMPLITUDE_FACTOR = 0.1;
export const ORB_SPEAKING_SPRING_DAMPING = 12;
export const ORB_SPEAKING_SPRING_STIFFNESS = 180;
export const ORB_SPEAKING_GLOW_BASE = 25;
export const ORB_SPEAKING_GLOW_RANGE = 30;
export const ORB_ERROR_SCALE = 0.95;
export const ORB_ERROR_GLOW = 10;
export const ORB_ERROR_DURATION = 300;
export const ORB_IDLE_GLOW = 30;
export const ORB_INITIAL_GLOW = 20;
export const ORB_PULSE_DURATION = 2_000;

// Screen animation
export const ANIM_FADE_DURATION = 800;
export const ANIM_SLIDE_DURATION = 600;
export const ANIM_SLIDE_DELAY_FAST = 300;
export const ANIM_SLIDE_DELAY_MEDIUM = 500;
export const ANIM_SLIDE_DELAY_SLOW = 600;
export const ANIM_CONNECT_FADE_DURATION = 1_000;
export const ANIM_CONNECT_DELAY_SLOW = 800;

// Sound effects
export const SOUND_CHIME_FREQUENCY = 523; // C5
export const SOUND_CHIME_DURATION_MS = 600;
export const SOUND_ERROR_FREQUENCY = 350;
export const SOUND_ERROR_DURATION_MS = 400;
export const SOUND_VOLUME = 0.4;

// Conversation history
export const MAX_CONVERSATION_HISTORY = 20;

// Date boundaries
export const DEFAULT_BIRTH_YEAR = 1990;
export const DEFAULT_BIRTH_MONTH = 5;
export const DEFAULT_BIRTH_DAY = 15;
export const MIN_BIRTH_YEAR = 1920;

// Colors — Dark theme (default cyberpunk)
export const COLORS = {
  background: "#050A15",
  surface: "#0A1628",
  surfaceLight: "#111D35",
  primary: "#00F0FF",
  primaryLight: "#38E8FF",
  accent: "#E040FB",
  text: "#E8F0FF",
  textSecondary: "#7B93B8",
  textMuted: "#4A6080",
  success: "#00FF88",
  error: "#FF3366",
  warning: "#FFB800",
  orbIdle: "#00F0FF",
  orbListening: "#00FF88",
  orbThinking: "#E040FB",
  orbSpeaking: "#C060FF",
  orbError: "#FF3366",
} as const;

// Colors — Light theme
export const COLORS_LIGHT = {
  background: "#F5F7FA",
  surface: "#FFFFFF",
  surfaceLight: "#EDF0F5",
  primary: "#0095FF",
  primaryLight: "#4DB8FF",
  accent: "#9C27B0",
  text: "#1A1A2E",
  textSecondary: "#5A6B80",
  textMuted: "#8E9AAF",
  success: "#00C853",
  error: "#FF1744",
  warning: "#FF9100",
  orbIdle: "#0095FF",
  orbListening: "#00C853",
  orbThinking: "#9C27B0",
  orbSpeaking: "#7C4DFF",
  orbError: "#FF1744",
} as const;

export type ColorScheme = {
  readonly [K in keyof typeof COLORS]: string;
};

// Supported languages (same as web i18n)
export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    label: "English",
    flag: "🇺🇸",
    voice: "en-US-AriaNeural",
    locale: "en-US",
  },
  {
    code: "id",
    label: "Bahasa Indonesia",
    flag: "🇮🇩",
    voice: "id-ID-GadisNeural",
    locale: "id-ID",
  },
  {
    code: "fr",
    label: "Français",
    flag: "🇫🇷",
    voice: "fr-FR-DeniseNeural",
    locale: "fr-FR",
  },
  {
    code: "de",
    label: "Deutsch",
    flag: "🇩🇪",
    voice: "de-DE-KatjaNeural",
    locale: "de-DE",
  },
  {
    code: "es",
    label: "Español",
    flag: "🇪🇸",
    voice: "es-ES-ElviraNeural",
    locale: "es-ES",
  },
  {
    code: "pt",
    label: "Português",
    flag: "🇧🇷",
    voice: "pt-BR-FranciscaNeural",
    locale: "pt-BR",
  },
  {
    code: "ru",
    label: "Русский",
    flag: "🇷🇺",
    voice: "ru-RU-SvetlanaNeural",
    locale: "ru-RU",
  },
  {
    code: "ja",
    label: "日本語",
    flag: "🇯🇵",
    voice: "ja-JP-NanamiNeural",
    locale: "ja-JP",
  },
  {
    code: "ko",
    label: "한국어",
    flag: "🇰🇷",
    voice: "ko-KR-SunHiNeural",
    locale: "ko-KR",
  },
  {
    code: "zh",
    label: "中文",
    flag: "🇨🇳",
    voice: "zh-CN-XiaoxiaoNeural",
    locale: "zh-CN",
  },
] as const;

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];
