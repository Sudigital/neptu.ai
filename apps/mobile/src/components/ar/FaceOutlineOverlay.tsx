import {
  Canvas,
  Path,
  Circle,
  BlurMask,
  DashPathEffect,
  vec,
  Line,
} from "@shopify/react-native-skia";
import { StyleSheet } from "react-native";

import type { FaceOutlineData } from "./face-outline-utils";

import {
  NEON,
  GLOW_MULTIPLIER,
  CORNER_OPACITY,
  STROKE_OPACITY,
  FEATURE_OPACITY,
  FEATURE_STROKE_WIDTH,
  LOW_OPACITY,
  HIGH_OPACITY,
  SCAN_BEAM_OPACITY,
  LABEL_LINE_OPACITY,
  trimPath,
  buildSmoothClosed,
  buildSmoothOpen,
  buildClosedLinear,
  buildCornerPaths,
  contourCenter,
  featureVisible,
  featureOpacity,
} from "./face-outline-utils";

export type {
  FaceBounds,
  FaceContours,
  FaceLandmarks,
  FaceOutlineData,
} from "./face-outline-utils";
export { contourCenter, getFaceAnchors } from "./face-outline-utils";

interface FaceOutlineOverlayProps {
  faces: FaceOutlineData[];
  scanProgress: number; // 0–1
  phase: "scanning" | "result";
}

export function FaceOutlineOverlay({
  faces,
  scanProgress,
  phase,
}: FaceOutlineOverlayProps) {
  if (faces.length === 0) return null;
  const face = faces[0];
  const { bounds, contours, landmarks } = face;
  const isResult = phase === "result";

  // Scan line position: sweeps top to bottom during scanning
  const scanY = bounds.y + scanProgress * bounds.height;
  const corners = buildCornerPaths(bounds);

  // Feature thresholds — each feature reveals progressively
  const T = {
    corners: 0,
    face: 0.05,
    eyebrows: 0.2,
    eyes: 0.3,
    nose: 0.5,
    lips: 0.65,
    iris: 0.4,
  };

  // Glow multiplier: brighter in result
  const gm = isResult ? GLOW_MULTIPLIER : 1;

  return (
    <Canvas style={styles.canvas}>
      {/* ═══ Scan line (only during scanning) ═══ */}
      {phase === "scanning" && (
        <>
          <Line
            p1={vec(bounds.x - 16, scanY)}
            p2={vec(bounds.x + bounds.width + 16, scanY)}
            color={`${NEON.scan}90`}
            strokeWidth={2}
            style="stroke"
          >
            <BlurMask blur={12} style="normal" />
          </Line>
          <Line
            p1={vec(bounds.x - 16, scanY)}
            p2={vec(bounds.x + bounds.width + 16, scanY)}
            color={`${NEON.scan}40`}
            strokeWidth={8}
            style="stroke"
          >
            <BlurMask blur={30} style="normal" />
          </Line>
        </>
      )}

      {/* ═══ Corner brackets ═══ */}
      {featureVisible(scanProgress, T.corners) &&
        corners.map((p, i) => (
          <Path
            key={`cr-${i}`}
            path={p}
            color={NEON.corner}
            style="stroke"
            strokeWidth={FEATURE_STROKE_WIDTH}
            opacity={
              featureOpacity(scanProgress, T.corners, isResult) * CORNER_OPACITY
            }
          >
            <BlurMask blur={3} style="normal" />
          </Path>
        ))}

      {/* ═══ Face contour ═══ */}
      {contours?.FACE &&
        featureVisible(scanProgress, T.face) &&
        (() => {
          const rawPath = buildSmoothClosed(contours.FACE);
          const faceProgress = isResult
            ? 1
            : Math.min(1, (scanProgress - T.face) / 0.5);
          const path = trimPath(rawPath, faceProgress);
          const op = featureOpacity(scanProgress, T.face, isResult);
          return (
            <>
              <Path
                path={path}
                color={NEON.face}
                style="stroke"
                strokeWidth={6 * gm}
                opacity={0.15 * op}
              >
                <BlurMask blur={20} style="normal" />
              </Path>
              <Path
                path={path}
                color={NEON.face}
                style="stroke"
                strokeWidth={3 * gm}
                opacity={STROKE_OPACITY * op}
              >
                <BlurMask blur={6} style="normal" />
              </Path>
              <Path
                path={path}
                color={NEON.face}
                style="stroke"
                strokeWidth={1.3}
                opacity={FEATURE_OPACITY * op}
              >
                <BlurMask blur={0.5} style="normal" />
              </Path>
            </>
          );
        })()}

      {/* ═══ Eyebrows ═══ */}
      {contours?.LEFT_EYEBROW_TOP &&
        featureVisible(scanProgress, T.eyebrows) &&
        (() => {
          const op = featureOpacity(scanProgress, T.eyebrows, isResult);
          return (
            <>
              <Path
                path={buildSmoothOpen(contours.LEFT_EYEBROW_TOP)}
                color={NEON.eyebrow}
                style="stroke"
                strokeWidth={FEATURE_STROKE_WIDTH * gm}
                opacity={0.2 * op}
              >
                <BlurMask blur={6} style="normal" />
              </Path>
              <Path
                path={buildSmoothOpen(contours.LEFT_EYEBROW_TOP)}
                color={NEON.eyebrow}
                style="stroke"
                strokeWidth={1.2}
                opacity={0.7 * op}
              >
                <BlurMask blur={1} style="normal" />
              </Path>
            </>
          );
        })()}
      {contours?.RIGHT_EYEBROW_TOP &&
        featureVisible(scanProgress, T.eyebrows) &&
        (() => {
          const op = featureOpacity(scanProgress, T.eyebrows, isResult);
          return (
            <>
              <Path
                path={buildSmoothOpen(contours.RIGHT_EYEBROW_TOP)}
                color={NEON.eyebrow}
                style="stroke"
                strokeWidth={FEATURE_STROKE_WIDTH * gm}
                opacity={0.2 * op}
              >
                <BlurMask blur={6} style="normal" />
              </Path>
              <Path
                path={buildSmoothOpen(contours.RIGHT_EYEBROW_TOP)}
                color={NEON.eyebrow}
                style="stroke"
                strokeWidth={1.2}
                opacity={0.7 * op}
              >
                <BlurMask blur={1} style="normal" />
              </Path>
            </>
          );
        })()}

      {/* ═══ Eyes ═══ */}
      {contours?.LEFT_EYE &&
        featureVisible(scanProgress, T.eyes) &&
        (() => {
          const op = featureOpacity(scanProgress, T.eyes, isResult);
          return (
            <>
              <Path
                path={buildSmoothClosed(contours.LEFT_EYE)}
                color={NEON.eye}
                style="stroke"
                strokeWidth={3 * gm}
                opacity={LOW_OPACITY * op}
              >
                <BlurMask blur={8} style="normal" />
              </Path>
              <Path
                path={buildSmoothClosed(contours.LEFT_EYE)}
                color={NEON.eye}
                style="stroke"
                strokeWidth={1.4}
                opacity={HIGH_OPACITY * op}
              >
                <BlurMask blur={1} style="normal" />
              </Path>
            </>
          );
        })()}
      {contours?.RIGHT_EYE &&
        featureVisible(scanProgress, T.eyes) &&
        (() => {
          const op = featureOpacity(scanProgress, T.eyes, isResult);
          return (
            <>
              <Path
                path={buildSmoothClosed(contours.RIGHT_EYE)}
                color={NEON.eye}
                style="stroke"
                strokeWidth={3 * gm}
                opacity={LOW_OPACITY * op}
              >
                <BlurMask blur={8} style="normal" />
              </Path>
              <Path
                path={buildSmoothClosed(contours.RIGHT_EYE)}
                color={NEON.eye}
                style="stroke"
                strokeWidth={1.4}
                opacity={HIGH_OPACITY * op}
              >
                <BlurMask blur={1} style="normal" />
              </Path>
            </>
          );
        })()}

      {/* ═══ Iris dots ═══ */}
      {contours?.LEFT_EYE &&
        featureVisible(scanProgress, T.iris) &&
        (() => {
          const c = contourCenter(contours.LEFT_EYE);
          const op = featureOpacity(scanProgress, T.iris, isResult);
          return (
            <Circle cx={c.x} cy={c.y} r={3} color={NEON.eye} opacity={0.7 * op}>
              <BlurMask blur={4} style="normal" />
            </Circle>
          );
        })()}
      {contours?.RIGHT_EYE &&
        featureVisible(scanProgress, T.iris) &&
        (() => {
          const c = contourCenter(contours.RIGHT_EYE);
          const op = featureOpacity(scanProgress, T.iris, isResult);
          return (
            <Circle cx={c.x} cy={c.y} r={3} color={NEON.eye} opacity={0.7 * op}>
              <BlurMask blur={4} style="normal" />
            </Circle>
          );
        })()}

      {/* ═══ Nose ═══ */}
      {contours?.NOSE_BRIDGE &&
        featureVisible(scanProgress, T.nose) &&
        (() => {
          const op = featureOpacity(scanProgress, T.nose, isResult);
          return (
            <>
              <Path
                path={buildSmoothOpen(contours.NOSE_BRIDGE)}
                color={NEON.nose}
                style="stroke"
                strokeWidth={2 * gm}
                opacity={0.15 * op}
              >
                <BlurMask blur={5} style="normal" />
              </Path>
              <Path
                path={buildSmoothOpen(contours.NOSE_BRIDGE)}
                color={NEON.nose}
                style="stroke"
                strokeWidth={0.8}
                opacity={0.5 * op}
              >
                <BlurMask blur={0.5} style="normal" />
              </Path>
            </>
          );
        })()}
      {contours?.NOSE_BOTTOM &&
        featureVisible(scanProgress, T.nose) &&
        (() => {
          const op = featureOpacity(scanProgress, T.nose, isResult);
          return (
            <>
              <Path
                path={buildSmoothOpen(contours.NOSE_BOTTOM)}
                color={NEON.nose}
                style="stroke"
                strokeWidth={2 * gm}
                opacity={0.15 * op}
              >
                <BlurMask blur={5} style="normal" />
              </Path>
              <Path
                path={buildSmoothOpen(contours.NOSE_BOTTOM)}
                color={NEON.nose}
                style="stroke"
                strokeWidth={0.8}
                opacity={0.5 * op}
              >
                <BlurMask blur={0.5} style="normal" />
              </Path>
            </>
          );
        })()}

      {/* ═══ Lips ═══ */}
      {contours?.UPPER_LIP_TOP &&
        contours?.LOWER_LIP_BOTTOM &&
        featureVisible(scanProgress, T.lips) &&
        (() => {
          const op = featureOpacity(scanProgress, T.lips, isResult);
          const lipPath = buildSmoothClosed([
            ...contours.UPPER_LIP_TOP,
            ...[...contours.LOWER_LIP_BOTTOM].reverse(),
          ]);
          return (
            <>
              <Path
                path={lipPath}
                color={NEON.lip}
                style="stroke"
                strokeWidth={4 * gm}
                opacity={0.2 * op}
              >
                <BlurMask blur={8} style="normal" />
              </Path>
              <Path
                path={lipPath}
                color={NEON.lip}
                style="stroke"
                strokeWidth={1.2}
                opacity={0.7 * op}
              >
                <BlurMask blur={1} style="normal" />
              </Path>
            </>
          );
        })()}

      {/* ═══ Landmark fallback ═══ */}
      {!contours &&
        landmarks &&
        (() => {
          const op = featureOpacity(scanProgress, T.face, isResult);
          return (
            <>
              {Object.values(landmarks).map((pt, i) => (
                <Circle
                  key={`lm-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={4}
                  color={NEON.face}
                  opacity={SCAN_BEAM_OPACITY * op}
                >
                  <BlurMask blur={6} style="normal" />
                </Circle>
              ))}
              <Path
                path={buildClosedLinear([
                  { x: bounds.x, y: bounds.y },
                  { x: bounds.x + bounds.width, y: bounds.y },
                  { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
                  { x: bounds.x, y: bounds.y + bounds.height },
                ])}
                color={NEON.face}
                style="stroke"
                strokeWidth={1}
                opacity={LABEL_LINE_OPACITY * op}
              >
                <DashPathEffect intervals={[8, 5]} />
                <BlurMask blur={2} style="normal" />
              </Path>
            </>
          );
        })()}
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: { ...StyleSheet.absoluteFillObject, zIndex: 8 },
});
