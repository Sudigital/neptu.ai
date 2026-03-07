import { Audio } from "expo-av";
import { File, Paths } from "expo-file-system";
import { useState, useCallback, useRef, useEffect } from "react";

import type { AmplitudeData } from "../types";

import {
  AMPLITUDE_HISTORY_SIZE,
  METERING_INTERVAL_MS,
  SIMULATED_AMPLITUDE_BASE,
  SIMULATED_AMPLITUDE_RANGE,
} from "../constants";

// Time (ms) for Android AudioManager to fully release communication audio focus
const ANDROID_AUDIO_TRANSITION_MS = 350;

/** Decode a base64 string to Uint8Array using built-in atob */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  amplitude: number;
  amplitudeHistory: AmplitudeData[];
  play: (uri: string) => Promise<void>;
  playBase64: (base64: string, contentType?: string) => Promise<void>;
  stop: () => Promise<void>;
}

// Map MIME types to file extensions
const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
};

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [amplitudeHistory, setAmplitudeHistory] = useState<AmplitudeData[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // Sound may already be unloaded
      }
      soundRef.current = null;
    }
    setIsPlaying(false);
    setAmplitude(0);
  }, []);

  const playFromUri = useCallback(
    async (fileUri: string): Promise<void> => {
      // Android audio mute fix: the AudioTrack stays muted after recording
      // unless we fully reset the audio mode AND wait for Android's audio
      // manager to release the communication audio focus.
      // Step 1 — disable recording mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Step 2 — wait for Android AudioManager to fully transition
      await new Promise<void>((r) =>
        setTimeout(r, ANDROID_AUDIO_TRANSITION_MS)
      );

      // Step 3 — set playback mode again (forces a fresh audio session)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Create sound WITHOUT auto-play so we can verify volume first
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: false, volume: 1.0 }
      );

      soundRef.current = sound;

      // Ensure volume is maxed out before playing
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();

      setIsPlaying(true);
      setAmplitudeHistory([]);

      // Simulate amplitude for visual orb feedback
      intervalRef.current = setInterval(() => {
        const simulated =
          SIMULATED_AMPLITUDE_BASE + Math.random() * SIMULATED_AMPLITUDE_RANGE;
        setAmplitude(simulated);
        setAmplitudeHistory((prev) => [
          ...prev.slice(-AMPLITUDE_HISTORY_SIZE),
          { amplitude: simulated, timestamp: Date.now() },
        ]);
      }, METERING_INTERVAL_MS);

      // Return a promise that resolves when playback finishes
      return new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            cleanup();
            resolve();
          }
        });
      });
    },
    [cleanup]
  );

  const play = useCallback(
    async (uri: string) => {
      await cleanup();

      try {
        // If it's a data URI, extract base64 and write to file
        if (uri.startsWith("data:")) {
          const match = uri.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const contentType = match[1];
            const base64Data = match[2];
            const ext = MIME_TO_EXT[contentType] || ".mp3";
            const tmpFile = new File(
              Paths.cache,
              `neptu_response_${Date.now()}${ext}`
            );

            tmpFile.write(base64ToBytes(base64Data));

            await playFromUri(tmpFile.uri);
            return;
          }
        }

        // Regular file URI
        await playFromUri(uri);
      } catch {
        await cleanup();
      }
    },
    [cleanup, playFromUri]
  );

  const playBase64 = useCallback(
    async (base64: string, contentType = "audio/mpeg") => {
      await cleanup();

      try {
        const ext = MIME_TO_EXT[contentType] || ".mp3";
        const tmpFile = new File(
          Paths.cache,
          `neptu_response_${Date.now()}${ext}`
        );

        tmpFile.write(base64ToBytes(base64));

        await playFromUri(tmpFile.uri);
      } catch {
        await cleanup();
      }
    },
    [cleanup, playFromUri]
  );

  const stop = useCallback(async () => {
    await cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isPlaying,
    amplitude,
    amplitudeHistory,
    play,
    playBase64,
    stop,
  };
}
