import { useState, useCallback } from "react";

import type { OrbState, VoiceOracleResponse } from "../types";

import { getLanguage } from "../services/storage";
import { voiceOracle } from "../services/voice-api";
import { useAudioPlayer } from "./useAudioPlayer";
import { useAudioRecorder } from "./useAudioRecorder";

interface UseNeptuOracleReturn {
  orbState: OrbState;
  amplitude: number;
  lastResponse: VoiceOracleResponse | null;
  error: string | null;
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  isActive: boolean;
}

export function useNeptuOracle(
  walletAddress: string | null
): UseNeptuOracleReturn {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [lastResponse, setLastResponse] = useState<VoiceOracleResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const recorder = useAudioRecorder();
  const player = useAudioPlayer();

  const isActive = orbState !== "idle" && orbState !== "error";

  const getAmplitude = (): number => {
    if (orbState === "listening") return recorder.amplitude;
    if (orbState === "speaking") return player.amplitude;
    return 0;
  };
  const amplitude = getAmplitude();

  const startConversation = useCallback(async () => {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }

    setError(null);
    setOrbState("listening");

    try {
      await recorder.startRecording();
    } catch {
      setOrbState("error");
      setError("Failed to start recording");
      setTimeout(() => setOrbState("idle"), 2000);
    }
  }, [walletAddress, recorder]);

  const stopConversation = useCallback(async () => {
    if (orbState !== "listening") return;

    try {
      // Stop recording
      const audioUri = await recorder.stopRecording();
      if (!audioUri) {
        setOrbState("idle");
        return;
      }

      // Thinking state while API processes
      setOrbState("thinking");

      const language = getLanguage();
      const response = await voiceOracle(audioUri, language);

      setLastResponse(response);

      // Play the oracle's response audio (base64-encoded)
      if (response.audioBase64) {
        setOrbState("speaking");
        await player.play(response.audioBase64);
      }

      setOrbState("idle");
    } catch (err) {
      setOrbState("error");
      setError(err instanceof Error ? err.message : "Oracle failed to respond");
      setTimeout(() => setOrbState("idle"), 2000);
    }
  }, [orbState, walletAddress, recorder, player]);

  return {
    orbState,
    amplitude,
    lastResponse,
    error,
    startConversation,
    stopConversation,
    isActive,
  };
}
