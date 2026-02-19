// ============================================================================
// Voice Oracle Constants
// ============================================================================

export const VOICE_LANGUAGES = {
  en: { locale: "en-US", voice: "en-US-AriaNeural", label: "English" },
  id: {
    locale: "id-ID",
    voice: "id-ID-GadisNeural",
    label: "Bahasa Indonesia",
  },
  fr: { locale: "fr-FR", voice: "fr-FR-DeniseNeural", label: "Français" },
  de: { locale: "de-DE", voice: "de-DE-KatjaNeural", label: "Deutsch" },
  es: { locale: "es-ES", voice: "es-ES-ElviraNeural", label: "Español" },
  pt: { locale: "pt-BR", voice: "pt-BR-FranciscaNeural", label: "Português" },
  ru: { locale: "ru-RU", voice: "ru-RU-SvetlanaNeural", label: "Русский" },
  ja: { locale: "ja-JP", voice: "ja-JP-NanamiNeural", label: "日本語" },
  ko: { locale: "ko-KR", voice: "ko-KR-SunHiNeural", label: "한국어" },
  zh: { locale: "zh-CN", voice: "zh-CN-XiaoxiaoNeural", label: "中文" },
} as const;

export type VoiceLanguageCode = keyof typeof VOICE_LANGUAGES;

export const VOICE_SUPPORTED_AUDIO_FORMATS = [
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
] as const;

export const VOICE_LIMITS = {
  FREE_DAILY_CONVERSATIONS: 5,
  MAX_AUDIO_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_RECORDING_DURATION_MS: 30_000,
  MAX_TEXT_LENGTH: 2000,
  AUDIO_SAMPLE_RATE: 16_000,
  TTS_OUTPUT_FORMAT: "audio-16khz-128kbitrate-mono-mp3",
  STT_OUTPUT_FORMAT: "detailed",
} as const;

export const VOICE_CACHE_TTL = {
  GREETING: 3600,
  TTS_AUDIO: 1800,
} as const;

export const VOICE_API_ENDPOINTS = {
  TRANSCRIBE: "/api/voice/transcribe",
  SYNTHESIZE: "/api/voice/synthesize",
  ORACLE: "/api/voice/oracle",
  GREETING: "/api/voice/greeting",
} as const;
