import { useState, useCallback, useRef, useEffect } from "react";

import type {
  OrbState,
  VoiceOracleResponse,
  ConversationEntry,
} from "../types";

import { FREE_DAILY_CONVERSATIONS } from "../constants";
import {
  getLanguage,
  getConversationsToday,
  incrementConversations,
  addConversation,
  getConversationHistory,
  getAutoPlayAudio,
} from "../services/storage";
import { voiceOracle } from "../services/voice-api";
import { useAudioPlayer } from "./useAudioPlayer";
import { useAudioRecorder } from "./useAudioRecorder";
import { useSoundEffects } from "./useSoundEffects";

interface UseNeptuOracleReturn {
  orbState: OrbState;
  amplitude: number;
  lastResponse: VoiceOracleResponse | null;
  error: string | null;
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  replayAudio: () => Promise<void>;
  clearLastResponse: () => void;
  isActive: boolean;
  isAudioPlaying: boolean;
  freeRemaining: number;
  conversationsUsed: number;
  history: ConversationEntry[];
  lastRewardEarned: number;
}

export function useNeptuOracle(
  walletAddress: string | null
): UseNeptuOracleReturn {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [lastResponse, setLastResponse] = useState<VoiceOracleResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [conversationsUsed, setConversationsUsed] = useState(
    getConversationsToday()
  );
  const [history, setHistory] = useState<ConversationEntry[]>(
    getConversationHistory()
  );
  const [lastRewardEarned, setLastRewardEarned] = useState(0);

  const recorder = useAudioRecorder();
  const player = useAudioPlayer();
  const sfx = useSoundEffects();
  const prevOrbStateRef = useRef<OrbState>("idle");

  // Auto-stop on silence: when recorder detects silence after speech,
  // automatically trigger stopConversation to send audio to API
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    if (recorder.silenceDetected && orbState === "listening") {
      stopRef.current?.();
    }
  }, [recorder.silenceDetected, orbState]);

  // Play sound effects on state transitions
  useEffect(() => {
    sfx.playForState(orbState, prevOrbStateRef.current);
    prevOrbStateRef.current = orbState;
  }, [orbState, sfx]);

  const isActive = orbState !== "idle" && orbState !== "error";
  const freeRemaining = Math.max(
    0,
    FREE_DAILY_CONVERSATIONS - conversationsUsed
  );

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

    if (walletAddress === "GUEST_MODE") {
      setError(
        "Connect your wallet to use the voice oracle. Guest mode is view-only."
      );
      return;
    }

    // Check free tier limit
    const used = getConversationsToday();
    if (used >= FREE_DAILY_CONVERSATIONS) {
      setError(
        `Daily free limit reached (${FREE_DAILY_CONVERSATIONS}/day). Upgrade for more.`
      );
      return;
    }

    setError(null);
    setLastResponse(null);
    setLastRewardEarned(0);
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

      // Track reward earned from this conversation
      setLastRewardEarned(response.rewardEarned ?? 0);

      // Track conversation usage
      const newCount = incrementConversations();
      setConversationsUsed(newCount);

      // Save to conversation history
      const entry: ConversationEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        transcript: response.transcript,
        response: response.response,
        language,
      };
      const updatedHistory = addConversation(entry);
      setHistory(updatedHistory);

      // Try auto-play — but don't block if it fails or user disabled it
      if (response.audioBase64) {
        const shouldAutoPlay = getAutoPlayAudio();
        const contentType = response.audioContentType || "audio/mpeg";
        if (shouldAutoPlay) {
          setOrbState("speaking");
          try {
            await player.playBase64(response.audioBase64, contentType);
          } catch {
            // Playback errors are non-critical — swallow silently
          }
        }
      }

      setOrbState("idle");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Oracle failed to respond";
      setOrbState("error");
      setError(message);
      setTimeout(() => setOrbState("idle"), 3000);
    }
  }, [orbState, walletAddress, recorder, player]);

  // Keep stopRef in sync for the silence-detection effect
  stopRef.current = stopConversation;

  const replayAudio = useCallback(async () => {
    if (!lastResponse?.audioBase64) return;
    const contentType = lastResponse.audioContentType || "audio/mpeg";
    try {
      await player.playBase64(lastResponse.audioBase64, contentType);
    } catch {
      // Playback errors are non-critical — swallow silently
    }
  }, [lastResponse, player]);

  const clearLastResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return {
    orbState,
    amplitude,
    lastResponse,
    error,
    startConversation,
    stopConversation,
    replayAudio,
    clearLastResponse,
    isActive,
    isAudioPlaying: player.isPlaying,
    freeRemaining,
    conversationsUsed,
    history,
    lastRewardEarned,
  };
}
