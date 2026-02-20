import { zValidator } from "@hono/zod-validator";
import { UserService, type Database } from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import {
  VOICE_LANGUAGES,
  VOICE_LIMITS,
  type VoiceLanguageCode,
} from "@neptu/shared";
import { Hono } from "hono";
import { z } from "zod";

import {
  isSpeechConfigured,
  synthesizeSpeech,
  transcribeAudio,
} from "../../lib/azure-speech";
import {
  dynamicJwtAuth,
  type DynamicJwtAuthEnv,
} from "../../middleware/dynamic-jwt-auth";

const log = createLogger({ name: "voice" });

type Env = DynamicJwtAuthEnv & {
  Variables: DynamicJwtAuthEnv["Variables"] & {
    db: Database;
  };
};

export const voiceRoutes = new Hono<Env>();

// All voice routes require authentication
voiceRoutes.use("/*", dynamicJwtAuth);

// Worker URL for calling oracle AI
function getWorkerUrl(): string {
  return process.env.WORKER_URL || "http://localhost:8787";
}

/**
 * POST /api/voice/transcribe
 * Convert audio to text via Azure Speech-to-Text
 *
 * Body: multipart/form-data { audio: File, language: string }
 * Returns: { success, text, confidence, language }
 */
voiceRoutes.post("/transcribe", async (c) => {
  if (!isSpeechConfigured()) {
    return c.json(
      { success: false, error: "Voice services not configured" },
      503
    );
  }

  const body = await c.req.parseBody();
  const audioFile = body["audio"];
  const language = (body["language"] as string) || "en";

  if (!audioFile || !(audioFile instanceof File)) {
    return c.json(
      { success: false, error: "audio file is required (multipart/form-data)" },
      400
    );
  }

  if (audioFile.size > VOICE_LIMITS.MAX_AUDIO_SIZE_BYTES) {
    return c.json(
      {
        success: false,
        error: `Audio file too large. Max ${VOICE_LIMITS.MAX_AUDIO_SIZE_BYTES / 1024 / 1024}MB`,
      },
      400
    );
  }

  if (!(language in VOICE_LANGUAGES)) {
    return c.json(
      { success: false, error: `Unsupported language: ${language}` },
      400
    );
  }

  try {
    const audioBuffer = await audioFile.arrayBuffer();
    const contentType = audioFile.type || "audio/wav";

    const result = await transcribeAudio(audioBuffer, language, contentType);

    if (!result.text) {
      return c.json({
        success: true,
        text: "",
        confidence: 0,
        language,
        message: "No speech detected in audio",
      });
    }

    return c.json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      language: result.language,
    });
  } catch (error) {
    log.error({ error }, "Transcription failed");
    return c.json(
      {
        success: false,
        error: "Failed to transcribe audio",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/voice/synthesize
 * Convert text to speech via Azure Neural TTS
 *
 * Body: JSON { text: string, language: string, voice?: string }
 * Returns: audio/mpeg binary
 */
voiceRoutes.post(
  "/synthesize",
  zValidator(
    "json",
    z.object({
      text: z.string().min(1).max(VOICE_LIMITS.MAX_TEXT_LENGTH),
      language: z.string().min(2).max(5),
      voice: z.string().optional(),
    })
  ),
  async (c) => {
    if (!isSpeechConfigured()) {
      return c.json(
        { success: false, error: "Voice services not configured" },
        503
      );
    }

    const { text, language, voice } = c.req.valid("json");

    if (!(language in VOICE_LANGUAGES)) {
      return c.json(
        { success: false, error: `Unsupported language: ${language}` },
        400
      );
    }

    try {
      const result = await synthesizeSpeech(text, language, voice);

      return new Response(result.audio, {
        headers: {
          "Content-Type": result.contentType,
          "Content-Length": result.audio.byteLength.toString(),
          "X-Audio-Duration-Ms": result.durationMs.toString(),
        },
      });
    } catch (error) {
      log.error({ error }, "Speech synthesis failed");
      return c.json(
        {
          success: false,
          error: "Failed to synthesize speech",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }
);

/**
 * POST /api/voice/oracle
 * Full voice conversation: audio in → STT → AI Oracle → TTS → audio out
 *
 * Uses user profile for birthDate + language (from /api/users/:wallet settings).
 * Body: multipart/form-data {
 *   audio: File,
 *   language?: string (override profile language)
 * }
 * Returns: JSON { success, transcript, response, audioBase64, ... }
 */
voiceRoutes.post("/oracle", async (c) => {
  if (!isSpeechConfigured()) {
    return c.json(
      { success: false, error: "Voice services not configured" },
      503
    );
  }

  // Get wallet from auth middleware
  const walletAddress = c.get("walletAddress");
  if (!walletAddress) {
    return c.json({ success: false, error: "Authentication required" }, 401);
  }

  // Look up user profile for birthDate + preferredLanguage
  const db = c.get("db");
  const userService = new UserService(db);
  const user = await userService.getUserByWallet(walletAddress);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  if (!user.birthDate) {
    return c.json(
      {
        success: false,
        error: "Birth date not set. Complete onboarding first.",
        requiresOnboarding: true,
      },
      400
    );
  }

  const body = await c.req.parseBody();
  const audioFile = body["audio"];
  // Allow language override, fallback to user profile, then default "en"
  const language =
    (body["language"] as string) || user.preferredLanguage || "en";

  // Validation
  if (!audioFile || !(audioFile instanceof File)) {
    return c.json({ success: false, error: "audio file is required" }, 400);
  }

  if (audioFile.size > VOICE_LIMITS.MAX_AUDIO_SIZE_BYTES) {
    return c.json({ success: false, error: "Audio file too large" }, 400);
  }

  if (!(language in VOICE_LANGUAGES)) {
    return c.json(
      { success: false, error: `Unsupported language: ${language}` },
      400
    );
  }

  try {
    // Step 1: Transcribe audio → text
    const audioBuffer = await audioFile.arrayBuffer();
    const contentType = audioFile.type || "audio/wav";
    const transcription = await transcribeAudio(
      audioBuffer,
      language,
      contentType
    );

    if (!transcription.text) {
      return c.json({
        success: true,
        transcript: "",
        response: "",
        audioBase64: null,
        message: "No speech detected",
      });
    }

    // Step 2: Call worker oracle with transcript as question
    const workerUrl = getWorkerUrl();
    const oracleResponse = await fetch(`${workerUrl}/api/oracle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: transcription.text,
        birthDate: user.birthDate,
        language,
      }),
    });

    if (!oracleResponse.ok) {
      const errorBody = await oracleResponse.text();
      log.error(
        { status: oracleResponse.status, body: errorBody },
        "Worker oracle call failed"
      );
      throw new Error(`Oracle service returned ${oracleResponse.status}`);
    }

    const oracleResult = (await oracleResponse.json()) as {
      success: boolean;
      message: string;
      cached: boolean;
      tokensUsed?: number;
    };

    if (!oracleResult.success || !oracleResult.message) {
      throw new Error("Oracle returned empty response");
    }

    // Step 3: Synthesize oracle response → audio
    const voiceLang = language as VoiceLanguageCode;
    const ttsResult = await synthesizeSpeech(oracleResult.message, voiceLang);

    // Encode audio as base64 for JSON transport
    const audioBase64 = Buffer.from(ttsResult.audio).toString("base64");

    log.info(
      {
        walletAddress,
        language,
        transcriptLength: transcription.text.length,
        responseLength: oracleResult.message.length,
        audioBytes: ttsResult.audio.byteLength,
        cached: oracleResult.cached,
      },
      "Voice oracle conversation completed"
    );

    return c.json({
      success: true,
      transcript: transcription.text,
      response: oracleResult.message,
      audioBase64,
      audioContentType: ttsResult.contentType,
      cached: oracleResult.cached,
      tokensUsed: oracleResult.tokensUsed,
    });
  } catch (error) {
    log.error({ error }, "Voice oracle failed");
    return c.json(
      {
        success: false,
        error: "Voice oracle conversation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/voice/greeting/:language
 * Get a daily voice greeting in the specified language
 *
 * Returns: JSON { success, text, audioBase64, language }
 */
voiceRoutes.get("/greeting/:language", async (c) => {
  if (!isSpeechConfigured()) {
    return c.json(
      { success: false, error: "Voice services not configured" },
      503
    );
  }

  const language = c.req.param("language");

  if (!(language in VOICE_LANGUAGES)) {
    return c.json(
      { success: false, error: `Unsupported language: ${language}` },
      400
    );
  }

  try {
    const greetingText = getGreetingText(language as VoiceLanguageCode);

    const ttsResult = await synthesizeSpeech(greetingText, language);
    const audioBase64 = Buffer.from(ttsResult.audio).toString("base64");

    return c.json({
      success: true,
      text: greetingText,
      audioBase64,
      audioContentType: ttsResult.contentType,
      language,
    });
  } catch (error) {
    log.error({ error }, "Greeting synthesis failed");
    return c.json(
      {
        success: false,
        error: "Failed to generate greeting",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

const GREETINGS: Record<VoiceLanguageCode, string> = {
  en: "Welcome to Neptu, your Balinese voice oracle. Ask me about your destiny, today's energy, or any question on your mind.",
  id: "Selamat datang di Neptu, orakel suara Bali Anda. Tanyakan tentang takdir Anda, energi hari ini, atau pertanyaan apa pun.",
  fr: "Bienvenue sur Neptu, votre oracle vocal balinais. Posez-moi une question sur votre destin ou l'énergie du jour.",
  de: "Willkommen bei Neptu, Ihrem balinesischen Sprach-Orakel. Fragen Sie mich nach Ihrem Schicksal oder der Energie des Tages.",
  es: "Bienvenido a Neptu, tu oráculo de voz balinés. Pregúntame sobre tu destino o la energía de hoy.",
  pt: "Bem-vindo ao Neptu, seu oráculo de voz balinês. Pergunte-me sobre seu destino ou a energia de hoje.",
  ru: "Добро пожаловать в Непту, ваш балийский голосовой оракул. Спросите меня о вашей судьбе или энергии дня.",
  ja: "ネプトゥへようこそ。バリの音声オラクルです。あなたの運命や今日のエネルギーについてお聞きください。",
  ko: "네프투에 오신 것을 환영합니다. 발리 음성 오라클입니다. 운명이나 오늘의 에너지에 대해 물어보세요.",
  zh: "欢迎来到涅普图，您的巴厘声音神谕。询问您的命运或今天的能量。",
};

function getGreetingText(language: VoiceLanguageCode): string {
  return GREETINGS[language] ?? GREETINGS.en;
}
