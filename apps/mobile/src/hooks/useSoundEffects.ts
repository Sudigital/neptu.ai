import { Audio } from "expo-av";
import { useCallback, useRef, useEffect } from "react";

import type { OrbState } from "../types";

import {
  SOUND_CHIME_FREQUENCY,
  SOUND_CHIME_DURATION_MS,
  SOUND_ERROR_FREQUENCY,
  SOUND_ERROR_DURATION_MS,
  SOUND_VOLUME,
} from "../constants";

// WAV header byte offsets
const WAV_NUM_CHANNELS_OFFSET = 22;
const WAV_BYTE_RATE_OFFSET = 28;
const WAV_BITS_PER_SAMPLE_OFFSET = 34;

// Audio generation constants
const INT16_MAX_VALUE = 32767;
const CHIME_FADE_RATIO = 0.08;
const PERFECT_FIFTH_RATIO = 1.5;
const MINOR_THIRD_DOWN_RATIO = 0.75;
const CHIME_DECAY_RATE = -2;
const ERROR_DECAY_RATE = -3;

interface UseSoundEffectsReturn {
  playForState: (state: OrbState, prevState: OrbState) => void;
  cleanup: () => Promise<void>;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Generate a chime: two-tone ascending (mystical feel)
function generateChimeWav(): string {
  const sampleRate = 22050;
  const totalDurationMs = SOUND_CHIME_DURATION_MS;
  const numSamples = Math.floor((sampleRate * totalDurationMs) / 1000);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, fileSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(WAV_NUM_CHANNELS_OFFSET, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(WAV_BYTE_RATE_OFFSET, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(WAV_BITS_PER_SAMPLE_OFFSET, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const freq1 = SOUND_CHIME_FREQUENCY;
  const freq2 = SOUND_CHIME_FREQUENCY * PERFECT_FIFTH_RATIO; // Perfect fifth above
  const fadeLength = Math.floor(numSamples * CHIME_FADE_RATIO);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Blend two notes: first note fades, second note rises
    const mix = i / numSamples;
    const tone1 = Math.sin(2 * Math.PI * freq1 * t) * (1 - mix);
    const tone2 = Math.sin(2 * Math.PI * freq2 * t) * mix;
    // Add a soft harmonic
    const harmonic = Math.sin(2 * Math.PI * freq1 * 2 * t) * 0.15 * (1 - mix);
    let amplitude = (tone1 + tone2 + harmonic) * 0.5;

    // Envelope
    if (i < fadeLength) {
      amplitude *= i / fadeLength;
    } else if (i > numSamples - fadeLength) {
      amplitude *= (numSamples - i) / fadeLength;
    }
    // Gentle decay
    amplitude *= Math.exp((CHIME_DECAY_RATE * i) / numSamples);

    const sample = Math.max(-1, Math.min(1, amplitude));
    view.setInt16(44 + i * 2, sample * INT16_MAX_VALUE, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

// Generate error tone: descending two-note
function generateErrorWav(): string {
  const sampleRate = 22050;
  const totalDurationMs = SOUND_ERROR_DURATION_MS;
  const numSamples = Math.floor((sampleRate * totalDurationMs) / 1000);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, fileSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(WAV_NUM_CHANNELS_OFFSET, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(WAV_BYTE_RATE_OFFSET, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(WAV_BITS_PER_SAMPLE_OFFSET, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const freq1 = SOUND_ERROR_FREQUENCY;
  const freq2 = SOUND_ERROR_FREQUENCY * MINOR_THIRD_DOWN_RATIO; // Minor third down
  const fadeLength = Math.floor(numSamples * CHIME_FADE_RATIO);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const mix = i / numSamples;
    const tone1 = Math.sin(2 * Math.PI * freq1 * t) * (1 - mix);
    const tone2 = Math.sin(2 * Math.PI * freq2 * t) * mix;
    let amplitude = (tone1 + tone2) * 0.5;

    if (i < fadeLength) {
      amplitude *= i / fadeLength;
    } else if (i > numSamples - fadeLength) {
      amplitude *= (numSamples - i) / fadeLength;
    }
    amplitude *= Math.exp((ERROR_DECAY_RATE * i) / numSamples);

    const sample = Math.max(-1, Math.min(1, amplitude));
    view.setInt16(44 + i * 2, sample * INT16_MAX_VALUE, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

// Pre-generate WAV data URIs (called once)
let chimeUri: string | null = null;
let errorUri: string | null = null;

function getChimeUri(): string {
  if (!chimeUri) chimeUri = generateChimeWav();
  return chimeUri;
}

function getErrorUri(): string {
  if (!errorUri) errorUri = generateErrorWav();
  return errorUri;
}

export function useSoundEffects(): UseSoundEffectsReturn {
  const soundRef = useRef<Audio.Sound | null>(null);

  const playSound = useCallback(async (uri: string) => {
    try {
      // Cleanup previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: SOUND_VOLUME },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            if (soundRef.current === sound) {
              soundRef.current = null;
            }
          }
        }
      );
      soundRef.current = sound;
    } catch {
      // Sound playback is non-critical, swallow errors
    }
  }, []);

  const playForState = useCallback(
    (state: OrbState, prevState: OrbState) => {
      // Chime when entering thinking state (oracle is processing)
      if (state === "thinking" && prevState !== "thinking") {
        playSound(getChimeUri());
      }
      // Error tone when entering error state
      if (state === "error" && prevState !== "error") {
        playSound(getErrorUri());
      }
    },
    [playSound]
  );

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { playForState, cleanup };
}
