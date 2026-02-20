import { createLogger } from "@neptu/logger";
import {
  VOICE_LANGUAGES,
  VOICE_LIMITS,
  type VoiceLanguageCode,
} from "@neptu/shared";

const log = createLogger({ name: "azure-speech" });

interface AzureSpeechConfig {
  subscriptionKey: string;
  region: string;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  durationMs: number;
}

interface SynthesisResult {
  audio: ArrayBuffer;
  contentType: string;
  durationMs: number;
}

function getConfig(): AzureSpeechConfig {
  const subscriptionKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!subscriptionKey || !region) {
    throw new Error("AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are required");
  }

  return { subscriptionKey, region };
}

function getVoiceConfig(languageCode: string) {
  const langKey = languageCode as VoiceLanguageCode;
  return VOICE_LANGUAGES[langKey] ?? VOICE_LANGUAGES.en;
}

/**
 * Transcribe audio to text using Azure Speech-to-Text REST API
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  languageCode: string,
  contentType: string = "audio/wav"
): Promise<TranscriptionResult> {
  const { subscriptionKey, region } = getConfig();
  const voiceConfig = getVoiceConfig(languageCode);

  const startTime = Date.now();
  const url = new URL(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
  );
  url.searchParams.set("language", voiceConfig.locale);
  url.searchParams.set("format", VOICE_LIMITS.STT_OUTPUT_FORMAT);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": contentType,
      Accept: "application/json",
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(
      { status: response.status, body: errorText },
      "Azure STT request failed"
    );
    throw new Error(`Azure STT failed: ${response.status} - ${errorText}`);
  }

  const result = (await response.json()) as {
    RecognitionStatus: string;
    DisplayText?: string;
    NBest?: Array<{
      Confidence: number;
      Display: string;
      Lexical: string;
    }>;
    Duration?: number;
    Offset?: number;
  };

  if (result.RecognitionStatus !== "Success") {
    log.warn({ status: result.RecognitionStatus }, "STT recognition failed");

    if (result.RecognitionStatus === "NoMatch") {
      return {
        text: "",
        confidence: 0,
        language: languageCode,
        durationMs: Date.now() - startTime,
      };
    }

    throw new Error(`STT recognition status: ${result.RecognitionStatus}`);
  }

  const bestResult = result.NBest?.[0];
  const text = bestResult?.Display ?? result.DisplayText ?? "";
  const confidence = bestResult?.Confidence ?? 1;

  log.info(
    {
      language: voiceConfig.locale,
      textLength: text.length,
      confidence,
      durationMs: Date.now() - startTime,
    },
    "STT transcription completed"
  );

  return {
    text,
    confidence,
    language: languageCode,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Build SSML for Azure Neural TTS
 */
function buildSsml(text: string, voiceName: string, locale: string): string {
  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="',
    locale,
    '">',
    '<voice name="',
    voiceName,
    '">',
    '<prosody rate="0.95" pitch="-2%">',
    escapedText,
    "</prosody>",
    "</voice>",
    "</speak>",
  ].join("");
}

/**
 * Synthesize text to speech using Azure TTS REST API
 */
export async function synthesizeSpeech(
  text: string,
  languageCode: string,
  voiceOverride?: string
): Promise<SynthesisResult> {
  const { subscriptionKey, region } = getConfig();
  const voiceConfig = getVoiceConfig(languageCode);
  const voiceName = voiceOverride ?? voiceConfig.voice;

  const startTime = Date.now();
  const ssml = buildSsml(text, voiceName, voiceConfig.locale);

  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": VOICE_LIMITS.TTS_OUTPUT_FORMAT,
      "User-Agent": "NeptuVoiceOracle",
    },
    body: ssml,
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(
      { status: response.status, body: errorText },
      "Azure TTS request failed"
    );
    throw new Error(`Azure TTS failed: ${response.status} - ${errorText}`);
  }

  const audio = await response.arrayBuffer();

  log.info(
    {
      language: voiceConfig.locale,
      voice: voiceName,
      textLength: text.length,
      audioBytes: audio.byteLength,
      durationMs: Date.now() - startTime,
    },
    "TTS synthesis completed"
  );

  return {
    audio,
    contentType: "audio/mpeg",
    durationMs: Date.now() - startTime,
  };
}

/**
 * Check if Azure Speech services are configured
 */
export function isSpeechConfigured(): boolean {
  return Boolean(
    process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION
  );
}
