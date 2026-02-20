import { Audio } from "expo-av";
import { useState, useCallback, useRef, useEffect } from "react";

import type { AmplitudeData } from "../types";

import {
  AMPLITUDE_HISTORY_SIZE,
  METERING_INTERVAL_MS,
  SIMULATED_AMPLITUDE_BASE,
  SIMULATED_AMPLITUDE_RANGE,
} from "../constants";

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  amplitude: number;
  amplitudeHistory: AmplitudeData[];
  play: (uri: string) => Promise<void>;
  stop: () => Promise<void>;
}

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

  const play = useCallback(
    async (uri: string) => {
      await cleanup();

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (!status.isLoaded) return;
            if (status.didJustFinish) {
              cleanup();
            }
          }
        );

        soundRef.current = sound;
        setIsPlaying(true);
        setAmplitudeHistory([]);

        // Simulate amplitude from playback position (real extraction
        // requires native module; this creates visual feedback)
        intervalRef.current = setInterval(() => {
          const simulated =
            SIMULATED_AMPLITUDE_BASE +
            Math.random() * SIMULATED_AMPLITUDE_RANGE;
          setAmplitude(simulated);
          setAmplitudeHistory((prev) => [
            ...prev.slice(-AMPLITUDE_HISTORY_SIZE),
            { amplitude: simulated, timestamp: Date.now() },
          ]);
        }, METERING_INTERVAL_MS);
      } catch {
        await cleanup();
      }
    },
    [cleanup]
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
    stop,
  };
}
