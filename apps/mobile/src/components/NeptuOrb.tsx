import { Canvas, Circle, Path, Shadow, Skia } from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { OrbState } from "../types";

import { COLORS, FREE_DAILY_CONVERSATIONS } from "../constants";
import { useVisualizerData } from "../hooks/useVisualizerData";

interface NeptuOrbProps {
  orbState: OrbState;
  amplitude: number;
  onPress?: () => void;
  disabled?: boolean;
  conversationsUsed?: number;
  freeRemaining?: number;
}

// --- Layout ---
const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;

// --- 8 cyberpunk blob layers (outer → inner) ---
const BLOB_COUNT = 8;
const BLOB_POINTS = 6; // control points per blob for organic shape

// Blob layer radii (outer → inner)
const BLOB_R1 = 105;
const BLOB_R2 = 92;
const BLOB_R3 = 78;
const BLOB_R4 = 65;
const BLOB_R5 = 52;
const BLOB_R6 = 38;
const BLOB_R7 = 22;
const LAYER_RADII = [
  120,
  BLOB_R1,
  BLOB_R2,
  BLOB_R3,
  BLOB_R4,
  BLOB_R5,
  BLOB_R6,
  BLOB_R7,
];
const LAYER_COLORS = [
  "#0D0221", // deep void purple
  "#1A0533", // dark neon purple
  "#3B0764", // electric purple
  "#7C3AED", // vivid violet
  "#A855F7", // neon lavender
  "#E879F9", // hot pink
  "#F97316", // cyber orange
  "#FBBF24", // neon amber core
];

// Blob layer opacities
const OPACITY_L0 = 0.85;
const OPACITY_L1 = 0.82;
const OPACITY_L2 = 0.8;
const OPACITY_L3 = 0.78;
const OPACITY_L4 = 0.75;
const OPACITY_L5 = 0.72;
const OPACITY_L7 = 0.9;
const LAYER_OPACITY = [
  OPACITY_L0,
  OPACITY_L1,
  OPACITY_L2,
  OPACITY_L3,
  OPACITY_L4,
  OPACITY_L5,
  0.7,
  OPACITY_L7,
];

// Phase offsets per layer — each layer wobbles differently
const PHASE_OFFSET_STEP = 0.8;
const LAYER_PHASE = Array.from(
  { length: BLOB_COUNT },
  (_, i) => i * PHASE_OFFSET_STEP
);

// Wobble strength per layer (outer wobbles more)
const WOBBLE_OUTER = 18;
const LAYER_WOBBLE = [WOBBLE_OUTER, 15, 12, 10, 8, 6, 4, 2];

// Audio reactivity strength per layer (inner reacts more)
const AUDIO_L2 = 0.25;
const AUDIO_L3 = 0.35;
const AUDIO_L4 = 0.45;
const AUDIO_L7 = 0.85;
const LAYER_AUDIO = [
  0.15,
  0.2,
  AUDIO_L2,
  AUDIO_L3,
  AUDIO_L4,
  0.55,
  0.7,
  AUDIO_L7,
];

// --- Animation ---
const TICK_MS = 40;
const PHASE_STEP = 0.055;
const SMOOTH = 0.22;
const THINKING_SPEED = 2.2;
const IDLE_WOBBLE = 0.35;
const ACTIVE_WOBBLE_BOOST = 0.8;
const WOBBLE_SECONDARY_FREQ = 1.3;
const CORE_DOT_ORBIT_SPEED = 1.5;
const AMBIENT_GLOW_BASE = 0.08;
const AMBIENT_GLOW_AMP = 0.1;

// --- Core glow ---
const CORE_R = 16;
const CORE_RING_R = 24;
const CORE_RING_STROKE = 2.5;
const CORE_DOT_R = 4;
const CORE_DOT_OFFSET = 34;

// --- Glow ---
const GLOW_INNER_BLUR = 25;
const GLOW_OUTER_BLUR = 40;

interface BlobPathOptions {
  cx: number;
  cy: number;
  baseR: number;
  wobble: number;
  phase: number;
  audioStr: number;
  amp: number;
}

function buildBlobPath(
  opts: BlobPathOptions
): ReturnType<typeof Skia.Path.Make> {
  const { cx, cy, baseR, wobble, phase, audioStr, amp } = opts;
  const path = Skia.Path.Make();
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < BLOB_POINTS; i++) {
    const angle = (i / BLOB_POINTS) * Math.PI * 2;
    // Organic wobble: combine two sine waves at different frequencies
    const w1 = Math.sin(angle * 2 + phase) * wobble;
    const w2 =
      Math.sin(angle * 3 - phase * WOBBLE_SECONDARY_FREQ) * wobble * 0.5;
    // Audio pulse: expand radius with amplitude
    const audioPulse = amp * audioStr * baseR * 0.3;
    // Audio wobble: high-freq distortion driven by amplitude
    const audioWobble = amp * audioStr * Math.sin(angle * 4 + phase * 2) * 12;
    const r = baseR + w1 + w2 + audioPulse + audioWobble;
    pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }

  // Closed smooth curve through all points using cubic bezier
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < BLOB_POINTS; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % BLOB_POINTS];
    const prev = pts[(i - 1 + BLOB_POINTS) % BLOB_POINTS];
    const next2 = pts[(i + 2) % BLOB_POINTS];

    // Catmull-Rom to cubic bezier control points
    const tension = 0.35;
    const cp1x = curr.x + (next.x - prev.x) * tension;
    const cp1y = curr.y + (next.y - prev.y) * tension;
    const cp2x = next.x - (next2.x - curr.x) * tension;
    const cp2y = next.y - (next2.y - curr.y) * tension;

    path.cubicTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
  }
  path.close();
  return path;
}

export function NeptuOrb({
  orbState,
  amplitude,
  onPress,
  disabled,
  conversationsUsed = 0,
  freeRemaining = FREE_DAILY_CONVERSATIONS,
}: NeptuOrbProps) {
  const { scale } = useVisualizerData(orbState, amplitude);

  const phaseRef = useRef(0);
  const ampSmooth = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const spd = orbState === "thinking" ? THINKING_SPEED : 1;
      phaseRef.current += PHASE_STEP * spd;
      ampSmooth.current += SMOOTH * (amplitude - ampSmooth.current);
      setTick((t) => t + 1);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [orbState, amplitude]);

  const phase = phaseRef.current;
  const amp = ampSmooth.current;
  const isActive = orbState === "listening" || orbState === "speaking";
  const isError = orbState === "error";
  let wobbleMult = IDLE_WOBBLE;
  if (isError) {
    wobbleMult = 0.3;
  } else if (isActive) {
    wobbleMult = 1 + amp * ACTIVE_WOBBLE_BOOST;
  }

  // Build 8 blob paths
  const blobs = useMemo(
    () =>
      LAYER_RADII.map((baseR, i) =>
        buildBlobPath({
          cx: CX,
          cy: CY,
          baseR,
          wobble: LAYER_WOBBLE[i] * wobbleMult,
          phase: phase + LAYER_PHASE[i],
          audioStr: LAYER_AUDIO[i],
          amp,
        })
      ),
    [phase, amp, wobbleMult]
  );

  // Core glow dot angle (orbits the core)
  const coreDotAngle = phase * CORE_DOT_ORBIT_SPEED;

  const orbScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value as number }],
  }));

  const total = FREE_DAILY_CONVERSATIONS;
  const ratio = total > 0 ? Math.min(conversationsUsed, total) / total : 0;

  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, onPress]);

  // Core brightness reacts to audio
  const coreOp = isError ? 0.4 : 0.7 + amp * 0.3;
  const ringOp = isError ? 0.3 : 0.5 + amp * 0.4;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <View style={[styles.orbWrapper, { width: SIZE, height: SIZE }]}>
        <Animated.View style={[StyleSheet.absoluteFill, orbScaleStyle]}>
          <Canvas style={StyleSheet.absoluteFill}>
            {/* Outer ambient glow */}
            <Circle
              cx={CX}
              cy={CY}
              r={LAYER_RADII[0] + 10}
              color={LAYER_COLORS[3]}
              opacity={AMBIENT_GLOW_BASE + amp * AMBIENT_GLOW_AMP}
            >
              <Shadow
                dx={0}
                dy={0}
                blur={GLOW_OUTER_BLUR}
                color={LAYER_COLORS[3]}
              />
            </Circle>

            {/* 8 layered blobs — outer to inner */}
            {blobs.map((blobPath, i) => (
              <Path
                key={i}
                path={blobPath}
                color={LAYER_COLORS[i]}
                opacity={LAYER_OPACITY[i]}
              >
                {i >= 5 && (
                  <Shadow
                    dx={0}
                    dy={0}
                    blur={GLOW_INNER_BLUR}
                    color={LAYER_COLORS[i]}
                  />
                )}
              </Path>
            ))}

            {/* White core glow */}
            <Circle
              cx={CX}
              cy={CY}
              r={CORE_R + amp * 6}
              color="#FFFFFF"
              opacity={coreOp}
            >
              <Shadow dx={0} dy={0} blur={20} color="#FBBF24" />
            </Circle>

            {/* Core ring */}
            <Circle
              cx={CX}
              cy={CY}
              r={CORE_RING_R + amp * 4}
              color={LAYER_COLORS[5]}
              opacity={ringOp}
              style="stroke"
              strokeWidth={CORE_RING_STROKE}
            >
              <Shadow dx={0} dy={0} blur={8} color={LAYER_COLORS[5]} />
            </Circle>

            {/* Orbiting dot */}
            <Circle
              cx={CX + Math.cos(coreDotAngle) * CORE_DOT_OFFSET}
              cy={
                CY +
                Math.sin(coreDotAngle) * CORE_DOT_OFFSET * 0.3 -
                CORE_DOT_OFFSET * 0.7
              }
              r={CORE_DOT_R}
              color="#FFFFFF"
              opacity={0.85}
            >
              <Shadow dx={0} dy={0} blur={6} color="#E879F9" />
            </Circle>
          </Canvas>
        </Animated.View>

        {/* Daily limit counter */}
        {orbState === "idle" && (
          <View style={styles.counterOverlay}>
            <Text
              style={[
                styles.counterText,
                ratio >= 1 && styles.counterExhausted,
              ]}
            >
              {freeRemaining}/{total}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  orbWrapper: { alignItems: "center", justifyContent: "center" },
  counterOverlay: { position: "absolute", bottom: 20, alignSelf: "center" },
  counterText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: "monospace",
    fontWeight: "900",
    letterSpacing: 4,
    opacity: 0.95,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  counterExhausted: {
    color: COLORS.error,
    opacity: 0.9,
    textShadowColor: COLORS.error,
  },
});
