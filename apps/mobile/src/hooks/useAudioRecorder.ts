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
  silenceDetected: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [amplitudeHistory, setAmplitudeHistory] = useState<AmplitudeData[]>([]);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadSpeechRef = useRef(false);

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
            // Android MediaRecorder cannot produce real WAV/PCM.
            // Use AAC in MPEG4 container — Azure STT supports this.
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
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

            // Reset silence timer on sound, restart when speech drops
            if (normalizedAmplitude > SILENCE_THRESHOLD) {
              hadSpeechRef.current = true;
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
            } else if (hadSpeechRef.current && !silenceTimerRef.current) {
              // User spoke then went silent — start silence countdown
              silenceTimerRef.current = setTimeout(() => {
                setSilenceDetected(true);
              }, SILENCE_TIMEOUT_MS);
            }
          }
        },
        METERING_INTERVAL_MS
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setSilenceDetected(false);
      setAmplitudeHistory([]);
      hadSpeechRef.current = false;

      // Max duration safety — signal silence so oracle can stop
      maxDurationTimerRef.current = setTimeout(() => {
        setSilenceDetected(true);
      }, MAX_RECORDING_DURATION_MS);

      // Initial silence: if user never speaks within delay + timeout, signal
      setTimeout(() => {
        if (!hadSpeechRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            setSilenceDetected(true);
          }, SILENCE_TIMEOUT_MS);
        }
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
      setSilenceDetected(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Must reset audio mode for playback on Android
      // This tells expo-av we're done recording so the
      // Android AudioManager can release communication audio focus
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Wait for Android to fully release the recording audio session
      await new Promise<void>((r) => setTimeout(r, 200));

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
    silenceDetected,
    startRecording,
    stopRecording,
  };
}
