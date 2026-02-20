import { Audio } from "expo-av";
import { useState, useCallback, useRef } from "react";

import type { AmplitudeData } from "../types";

import {
  MAX_RECORDING_DURATION_MS,
  SILENCE_TIMEOUT_MS,
  AMPLITUDE_HISTORY_SIZE,
  SILENCE_THRESHOLD,
  METERING_INTERVAL_MS,
  METERING_DB_OFFSET,
  INITIAL_SILENCE_DELAY_MS,
} from "../constants";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  amplitude: number;
  amplitudeHistory: AmplitudeData[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [amplitudeHistory, setAmplitudeHistory] = useState<AmplitudeData[]>([]);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            extension: ".wav",
            outputFormat: Audio.AndroidOutputFormat.DEFAULT,
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
            sampleRate: 16000,
            numberOfChannels: 1,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            extension: ".wav",
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            sampleRate: 16000,
            numberOfChannels: 1,
          },
          isMeteringEnabled: true,
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            // Convert dB to 0-1 amplitude (dB is negative, -160 to 0)
            const normalizedAmplitude = Math.max(
              0,
              Math.min(
                1,
                (status.metering + METERING_DB_OFFSET) / METERING_DB_OFFSET
              )
            );
            setAmplitude(normalizedAmplitude);
            setAmplitudeHistory((prev) => [
              ...prev.slice(-AMPLITUDE_HISTORY_SIZE),
              { amplitude: normalizedAmplitude, timestamp: Date.now() },
            ]);

            // Reset silence timer on sound
            if (
              normalizedAmplitude > SILENCE_THRESHOLD &&
              silenceTimerRef.current
            ) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
        },
        METERING_INTERVAL_MS
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setAmplitudeHistory([]);

      // Max duration safety
      maxDurationTimerRef.current = setTimeout(async () => {
        await stopRecording();
      }, MAX_RECORDING_DURATION_MS);

      // Silence detection start after initial delay
      setTimeout(() => {
        silenceTimerRef.current = setTimeout(async () => {
          await stopRecording();
        }, SILENCE_TIMEOUT_MS);
      }, INITIAL_SILENCE_DELAY_MS);
    } catch {
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    cleanup();

    if (!recordingRef.current) return null;

    try {
      setIsRecording(false);
      setAmplitude(0);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      return uri;
    } catch {
      recordingRef.current = null;
      setIsRecording(false);
      return null;
    }
  }, [cleanup]);

  return {
    isRecording,
    amplitude,
    amplitudeHistory,
    startRecording,
    stopRecording,
  };
}
