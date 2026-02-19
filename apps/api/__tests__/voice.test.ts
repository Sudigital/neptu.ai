import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

import { VOICE_LIMITS } from "@neptu/shared";
import { Hono } from "hono";

import type { WalletAuthEnv } from "../src/middleware/wallet-auth";

import { walletAuth } from "../src/middleware/wallet-auth";

const TEST_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

// Store originals for env mocking
const originalEnv = { ...process.env };

beforeAll(() => {
  process.env.AZURE_SPEECH_KEY = "test-key-12345";
  process.env.AZURE_SPEECH_REGION = "eastus";
  process.env.WORKER_URL = "http://localhost:8787";
});

afterAll(() => {
  process.env.AZURE_SPEECH_KEY = originalEnv.AZURE_SPEECH_KEY;
  process.env.AZURE_SPEECH_REGION = originalEnv.AZURE_SPEECH_REGION;
  process.env.WORKER_URL = originalEnv.WORKER_URL;
});

/**
 * Creates a test Hono app with walletAuth (simpler than dynamicJwtAuth for tests)
 * and mounts routes that mirror the voice route logic for unit testing.
 */
function createVoiceTestApp() {
  const app = new Hono<WalletAuthEnv>();
  app.use("/*", walletAuth);

  // Transcribe endpoint mock
  app.post("/transcribe", async (c) => {
    const body = await c.req.parseBody();
    const audioFile = body["audio"];
    const language = (body["language"] as string) || "en";

    if (!audioFile || !(audioFile instanceof File)) {
      return c.json(
        {
          success: false,
          error: "audio file is required (multipart/form-data)",
        },
        400
      );
    }

    if (audioFile.size > VOICE_LIMITS.MAX_AUDIO_SIZE_BYTES) {
      return c.json({ success: false, error: "Audio file too large" }, 400);
    }

    return c.json({
      success: true,
      text: "What is my destiny today?",
      confidence: 0.95,
      language,
    });
  });

  // Synthesize endpoint mock
  app.post("/synthesize", async (c) => {
    const body = await c.req.json<{
      text: string;
      language: string;
      voice?: string;
    }>();

    if (!body.text || body.text.length === 0) {
      return c.json({ success: false, error: "text is required" }, 400);
    }

    if (body.text.length > VOICE_LIMITS.MAX_TEXT_LENGTH) {
      return c.json({ success: false, error: "Text too long" }, 400);
    }

    // Return mock audio bytes
    const audioBytes = new Uint8Array(1024);
    return new Response(audioBytes.buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": "1024",
      },
    });
  });

  // Oracle endpoint mock
  app.post("/oracle", async (c) => {
    const body = await c.req.parseBody();
    const audioFile = body["audio"];
    const language = (body["language"] as string) || "en";
    const birthDate = body["birthDate"] as string;

    if (!audioFile || !(audioFile instanceof File)) {
      return c.json({ success: false, error: "audio file is required" }, 400);
    }

    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return c.json(
        { success: false, error: "birthDate is required (YYYY-MM-DD)" },
        400
      );
    }

    return c.json({
      success: true,
      transcript: "What is my destiny today?",
      response: "Today your energy aligns with creative pursuits.",
      audioBase64: "bW9ja2F1ZGlv",
      audioContentType: "audio/mpeg",
      cached: false,
      tokensUsed: 150,
    });
  });

  // Greeting endpoint mock
  app.get("/greeting/:language", (c) => {
    const language = c.req.param("language");

    const validLanguages = [
      "en",
      "id",
      "fr",
      "de",
      "es",
      "pt",
      "ru",
      "ja",
      "ko",
      "zh",
    ];
    if (!validLanguages.includes(language)) {
      return c.json(
        { success: false, error: `Unsupported language: ${language}` },
        400
      );
    }

    return c.json({
      success: true,
      text: "Welcome to Neptu, your Balinese voice oracle.",
      audioBase64: "bW9ja2F1ZGlv",
      audioContentType: "audio/mpeg",
      language,
    });
  });

  return app;
}

function createAudioFormData(
  fields: Record<string, string> = {},
  audioSize: number = 1024
): FormData {
  const formData = new FormData();
  const audioBytes = new Uint8Array(audioSize);
  const audioBlob = new Blob([audioBytes], { type: "audio/wav" });
  formData.append("audio", audioBlob, "recording.wav");

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  return formData;
}

describe("Voice API - Transcribe", () => {
  test("should reject requests without auth", async () => {
    const app = createVoiceTestApp();
    const formData = createAudioFormData({ language: "en" });

    const res = await app.request("/transcribe", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(401);
  });

  test("should reject requests without audio file", async () => {
    const app = createVoiceTestApp();
    const formData = new FormData();
    formData.append("language", "en");

    const res = await app.request("/transcribe", {
      method: "POST",
      body: formData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("audio file is required");
  });

  test("should reject oversized audio files", async () => {
    const app = createVoiceTestApp();
    const oversizedData = createAudioFormData(
      { language: "en" },
      VOICE_LIMITS.MAX_AUDIO_SIZE_BYTES + 1
    );

    const res = await app.request("/transcribe", {
      method: "POST",
      body: oversizedData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("too large");
  });

  test("should transcribe audio successfully", async () => {
    const app = createVoiceTestApp();
    const formData = createAudioFormData({ language: "en" });

    const res = await app.request("/transcribe", {
      method: "POST",
      body: formData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.text).toBe("What is my destiny today?");
    expect(body.confidence).toBeGreaterThan(0);
    expect(body.language).toBe("en");
  });

  test("should accept different languages", async () => {
    const app = createVoiceTestApp();
    const formData = createAudioFormData({ language: "id" });

    const res = await app.request("/transcribe", {
      method: "POST",
      body: formData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.language).toBe("id");
  });
});

describe("Voice API - Synthesize", () => {
  test("should reject requests without auth", async () => {
    const app = createVoiceTestApp();

    const res = await app.request("/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello", language: "en" }),
    });

    expect(res.status).toBe(401);
  });

  test("should synthesize text to audio", async () => {
    const app = createVoiceTestApp();

    const res = await app.request("/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Wallet-Address": TEST_WALLET,
      },
      body: JSON.stringify({
        text: "Your destiny is aligned with the stars.",
        language: "en",
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  test("should reject empty text", async () => {
    const app = createVoiceTestApp();

    const res = await app.request("/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Wallet-Address": TEST_WALLET,
      },
      body: JSON.stringify({ text: "", language: "en" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("Voice API - Oracle", () => {
  test("should reject requests without auth", async () => {
    const app = createVoiceTestApp();
    const formData = createAudioFormData({
      language: "en",
      birthDate: "1990-05-15",
    });

    const res = await app.request("/oracle", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(401);
  });

  test("should reject requests without birthDate", async () => {
    const app = createVoiceTestApp();
    const formData = createAudioFormData({ language: "en" });

    const res = await app.request("/oracle", {
      method: "POST",
      body: formData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("birthDate");
  });

  test("should reject invalid birthDate format", async () => {
    const app = createVoiceTestApp();
    const formData = createAudioFormData({
      language: "en",
      birthDate: "invalid-date",
    });

    const res = await app.request("/oracle", {
      method: "POST",
      body: formData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("birthDate");
  });

  test("should process voice oracle conversation", async () => {
    const app = createVoiceTestApp();
    const formData = createAudioFormData({
      language: "en",
      birthDate: "1990-05-15",
    });

    const res = await app.request("/oracle", {
      method: "POST",
      body: formData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.transcript).toBeTruthy();
    expect(body.response).toBeTruthy();
    expect(body.audioBase64).toBeTruthy();
    expect(body.audioContentType).toBe("audio/mpeg");
  });

  test("should reject missing audio file", async () => {
    const app = createVoiceTestApp();
    const formData = new FormData();
    formData.append("language", "en");
    formData.append("birthDate", "1990-05-15");

    const res = await app.request("/oracle", {
      method: "POST",
      body: formData,
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("audio");
  });
});

describe("Voice API - Greeting", () => {
  test("should reject requests without auth", async () => {
    const app = createVoiceTestApp();

    const res = await app.request("/greeting/en");
    expect(res.status).toBe(401);
  });

  test("should return greeting for valid language", async () => {
    const app = createVoiceTestApp();

    const res = await app.request("/greeting/en", {
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.text).toBeTruthy();
    expect(body.audioBase64).toBeTruthy();
    expect(body.language).toBe("en");
  });

  test("should return greeting in Indonesian", async () => {
    const app = createVoiceTestApp();

    const res = await app.request("/greeting/id", {
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.language).toBe("id");
  });

  test("should reject unsupported language", async () => {
    const app = createVoiceTestApp();

    const res = await app.request("/greeting/xx", {
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Unsupported language");
  });

  test("should return all supported languages", async () => {
    const app = createVoiceTestApp();
    const languages = [
      "en",
      "id",
      "fr",
      "de",
      "es",
      "pt",
      "ru",
      "ja",
      "ko",
      "zh",
    ];

    for (const lang of languages) {
      const res = await app.request(`/greeting/${lang}`, {
        headers: { "X-Wallet-Address": TEST_WALLET },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.language).toBe(lang);
    }
  });
});

describe("Voice API - Azure Speech Config", () => {
  test("isSpeechConfigured returns true when env vars set", async () => {
    const { isSpeechConfigured } = await import("../src/lib/azure-speech");
    expect(isSpeechConfigured()).toBe(true);
  });
});
