import {
  Canvas,
  Circle,
  RoundedRect,
  BlurMask,
  Group,
  Skia,
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";

import type { AuraZone } from "../../hooks/useAuraData";
import type { FaceOutlineData } from "./FaceOutlineOverlay";

import { getFaceAnchors } from "./FaceOutlineOverlay";

interface Point {
  x: number;
  y: number;
}

interface FaceAuraEffectProps {
  faces: FaceOutlineData[];
  zones: AuraZone[];
  phase: "scanning" | "result";
  scanProgress: number;
}

// Raster grid settings — Paper.js Division Raster concept
const CELL_SIZE = 18;
const INNER_MARGIN = 12;
const OUTER_RADIUS = 220;
const FPS_INTERVAL = 50;

// Deterministic hash constants
const HASH_PRIME_COL = 374761;
const HASH_PRIME_ROW = 668265;
const HASH_PRIME_SEED = 982451;
const HASH_MULTIPLIER = 0x45d9f3b;
const HASH_MAX = 0x7fffffff;

// Default seed for pre-computed grid
const DEFAULT_SEED = 42;

// Visibility / fade-in
const VISIBILITY_POWER = 1.2;
const VISIBILITY_THRESHOLD = 0.01;

// Global breathe animation
const BREATHE_BASE = 0.92;
const BREATHE_AMPLITUDE = 0.08;

// Ambient glow layer opacities
const GLOW_OPACITY_TOP = 0.12;
const GLOW_OPACITY_BOTTOM = 0.1;

// Per-cell pulse animation
const PULSE_BASE = 0.85;
const PULSE_AMPLITUDE = 0.15;
const PULSE_FREQUENCY = 1.5;
const PULSE_PHASE_SCALE = 6.28; // ≈ 2π
const BREATHE_CELL_VARIATION = 0.06;

// Cell sizing
const CELL_RADIUS_RATIO = 0.42;
const MIN_CELL_RADIUS = 1.2;

// Cell opacity
const BASE_OPACITY = 0.65;
const OPACITY_VARIATION = 0.1;
const OPACITY_THRESHOLD = 0.02;

// Color shift
const COLOR_SHIFT_PI = 3.14;

// Close / far cell distinction
const CLOSE_DISTANCE_RATIO = 0.35;

// Far-cell blur
const FAR_BLUR_MULTIPLIER = 14;

// Sparkle (edge particles)
const SPARKLE_RADIUS_RATIO = 0.28;
const SPARKLE_MIN_RADIUS = 0.8;
const SPARKLE_OPACITY = 0.8;

const { width: SW, height: SH } = Dimensions.get("window");

// Zone anchor mappings: each zone influences a region relative to face center
// cipta = crown (top), rasa = left cheek (heart), karsa = center (solar plexus),
// tindakan = right cheek (hands), frekuensi = chin (full body)
const ZONE_ANCHORS = [
  { key: "cipta", dx: 0, dy: -0.9 },
  { key: "rasa", dx: -0.7, dy: -0.1 },
  { key: "karsa", dx: 0, dy: -0.3 },
  { key: "tindakan", dx: 0.7, dy: -0.1 },
  { key: "frekuensi", dx: 0, dy: 0.8 },
] as const;

// Compute outward-facing normal at each contour point
function computeNormals(pts: Point[], cx: number, cy: number): Point[] {
  const n = pts.length;
  const normals: Point[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    let nx = -(next.y - prev.y);
    let ny = next.x - prev.x;
    const len = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= len;
    ny /= len;
    if (nx * (pts[i].x - cx) + ny * (pts[i].y - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    normals.push({ x: nx, y: ny });
  }
  return normals;
}

function offsetContour(pts: Point[], normals: Point[], dist: number): Point[] {
  return pts.map((p, i) => ({
    x: p.x + normals[i].x * dist,
    y: p.y + normals[i].y * dist,
  }));
}

// Build smooth closed Skia path (quadratic Bézier)
function buildSmoothPath(pts: Point[]) {
  const path = Skia.Path.Make();
  const n = pts.length;
  if (n < 3) return path;
  path.moveTo((pts[0].x + pts[n - 1].x) / 2, (pts[0].y + pts[n - 1].y) / 2);
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    path.quadTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
  }
  path.close();
  return path;
}

// Check if point is inside closed polygon (ray-casting)
function pointInsidePolygon(px: number, py: number, poly: Point[]): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Distance from point to nearest point on polygon
function distToPolygon(px: number, py: number, poly: Point[]): number {
  let minD = Infinity;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((px - a.x) * dx + (py - a.y) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    if (d < minD) minD = d;
  }
  return minD;
}

// Deterministic hash for per-cell randomness (no Math.random)
function cellHash(col: number, row: number, seed: number): number {
  let h =
    (col * HASH_PRIME_COL + row * HASH_PRIME_ROW + seed * HASH_PRIME_SEED) | 0;
  h = ((h >> 16) ^ h) * HASH_MULTIPLIER;
  h = ((h >> 16) ^ h) * HASH_MULTIPLIER;
  h = (h >> 16) ^ h;
  return (h & HASH_MAX) / HASH_MAX;
}

// Lerp hex colors
function lerpColor(a: string, b: string, t2: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(
    ((pa >> 16) & 0xff) + (((pb >> 16) & 0xff) - ((pa >> 16) & 0xff)) * t2
  );
  const g = Math.round(
    ((pa >> 8) & 0xff) + (((pb >> 8) & 0xff) - ((pa >> 8) & 0xff)) * t2
  );
  const bl = Math.round((pa & 0xff) + ((pb & 0xff) - (pa & 0xff)) * t2);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

// Pre-compute grid cell positions for the full screen
interface RasterCell {
  col: number;
  row: number;
  cx: number;
  cy: number;
  hash: number;
}

const ALL_CELLS: RasterCell[] = (() => {
  const cells: RasterCell[] = [];
  const cols = Math.ceil(SW / CELL_SIZE);
  const rows = Math.ceil(SH / CELL_SIZE);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        col: c,
        row: r,
        cx: c * CELL_SIZE + CELL_SIZE / 2,
        cy: r * CELL_SIZE + CELL_SIZE / 2,
        hash: cellHash(c, r, DEFAULT_SEED),
      });
    }
  }
  return cells;
})();

export function FaceAuraEffect({
  faces,
  zones,
  phase,
  scanProgress,
}: FaceAuraEffectProps) {
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
    }, FPS_INTERVAL);
    return () => clearInterval(iv);
  }, []);

  const face = faces.length > 0 ? faces[0] : null;
  const facePts = face?.contours?.FACE;

  // Pre-build face mask path for invertClip
  const clipData = useMemo(() => {
    if (!face || !facePts || facePts.length < 5) return null;
    const anchors = getFaceAnchors(face);
    const normals = computeNormals(facePts, anchors.cx, anchors.cy);
    const maskPts = offsetContour(facePts, normals, INNER_MARGIN);
    return { path: buildSmoothPath(maskPts), normals, anchors };
  }, [face, facePts]);

  // Build the raster cells that fall within the aura area
  const rasterData = useMemo(() => {
    if (!face || !facePts || facePts.length < 5 || !clipData) return null;

    const { anchors } = clipData;
    const { cx, cy } = anchors;
    const faceW = face.bounds.width;
    const faceH = face.bounds.height;

    // Zone anchor world positions + colors
    const zoneInfo = ZONE_ANCHORS.map((za) => {
      const zone = zones.find((z) => z.key === za.key);
      return {
        wx: cx + za.dx * faceW * 0.5,
        wy: cy + za.dy * faceH * 0.5,
        color: zone?.color ?? "#A855F7",
        intensity: zone?.intensity ?? 0.5,
      };
    });

    // Filter cells: outside face contour but within OUTER_RADIUS of face center
    const result: {
      cell: RasterCell;
      dist: number;
      zoneColor: string;
      zoneIntensity: number;
    }[] = [];

    for (const cell of ALL_CELLS) {
      // Skip cells inside the face polygon
      if (pointInsidePolygon(cell.cx, cell.cy, facePts)) continue;

      const dist = distToPolygon(cell.cx, cell.cy, facePts);
      if (dist > OUTER_RADIUS) continue;

      // Find nearest zone influence via weighted blend
      let totalW = 0;
      let rAcc = 0;
      let gAcc = 0;
      let bAcc = 0;
      let intAcc = 0;

      for (const zi of zoneInfo) {
        const dx = cell.cx - zi.wx;
        const dy = cell.cy - zi.wy;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        const w = 1 / (d * d);
        const c = parseInt(zi.color.slice(1), 16);
        rAcc += ((c >> 16) & 0xff) * w;
        gAcc += ((c >> 8) & 0xff) * w;
        bAcc += (c & 0xff) * w;
        intAcc += zi.intensity * w;
        totalW += w;
      }

      const rr = Math.round(rAcc / totalW);
      const gg = Math.round(gAcc / totalW);
      const bb = Math.round(bAcc / totalW);
      const color = `#${((rr << 16) | (gg << 8) | bb).toString(16).padStart(6, "0")}`;

      result.push({
        cell,
        dist,
        zoneColor: color,
        zoneIntensity: intAcc / totalW,
      });
    }

    return result;
  }, [face, facePts, zones, clipData]);

  if (!face || !facePts || facePts.length < 5 || !clipData || !rasterData) {
    return null;
  }

  const visibility =
    phase === "result" ? 1 : Math.pow(scanProgress, VISIBILITY_POWER);
  if (visibility < VISIBILITY_THRESHOLD) return null;

  const t = tick * FPS_INTERVAL * 0.001;
  const breathe = BREATHE_BASE + BREATHE_AMPLITUDE * Math.sin(t * 1.1);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      <Group clip={clipData.path} invertClip>
        {/* ═══ LAYER 1: Soft ambient glow behind raster ═══ */}
        {rasterData.length > 0 &&
          (() => {
            const colors = zones.map((z) => z.color);
            const c0 = colors[0] ?? "#0EA5E9";
            const c4 = colors[4] ?? "#A855F7";
            const { cx, cy } = clipData.anchors;
            const fH = face.bounds.height;
            const avgI =
              zones.reduce((s, z) => s + z.intensity, 0) / zones.length;
            return (
              <>
                <Circle
                  cx={cx}
                  cy={cy - fH * 0.6}
                  r={180}
                  color={c0}
                  opacity={GLOW_OPACITY_TOP * visibility * avgI}
                >
                  <BlurMask blur={100} style="normal" />
                </Circle>
                <Circle
                  cx={cx}
                  cy={cy + fH * 0.5}
                  r={160}
                  color={c4}
                  opacity={GLOW_OPACITY_BOTTOM * visibility * avgI}
                >
                  <BlurMask blur={90} style="normal" />
                </Circle>
              </>
            );
          })()}

        {/* ═══ LAYER 2: Division Raster — mosaic of colored cells ═══ */}
        {rasterData.map(({ cell, dist, zoneColor, zoneIntensity }) => {
          // Distance-based falloff: cells near face are larger/brighter
          const falloff = 1 - Math.min(dist / OUTER_RADIUS, 1);
          const falloffCurve = falloff * falloff;

          // Per-cell animation: subtle pulse using hash for phase offset
          const pulse =
            PULSE_BASE +
            PULSE_AMPLITUDE *
              Math.sin(t * PULSE_FREQUENCY + cell.hash * PULSE_PHASE_SCALE);
          const breatheCell =
            breathe + (cell.hash - 0.5) * BREATHE_CELL_VARIATION;

          // Cell radius: varies by distance, intensity, and animation
          const baseR = CELL_SIZE * CELL_RADIUS_RATIO;
          const r =
            baseR *
            falloffCurve *
            pulse *
            breatheCell *
            visibility *
            (0.6 + 0.4 * zoneIntensity);

          if (r < MIN_CELL_RADIUS) return null;

          // Opacity: stronger near face, fades outward
          const baseOp = BASE_OPACITY * falloffCurve + OPACITY_VARIATION;
          const op = baseOp * visibility * pulse * (0.5 + 0.5 * zoneIntensity);

          if (op < OPACITY_THRESHOLD) return null;

          // Slight color shift over time for liveliness
          const shift =
            (Math.sin(t * 0.4 + cell.hash * COLOR_SHIFT_PI) + 1) * 0.5;
          const white = "#FFFFFF";
          const color = lerpColor(zoneColor, white, shift * 0.15);

          // Use RoundedRect for close cells (square mosaic), Circle for far (scatter)
          const isClose = dist < OUTER_RADIUS * CLOSE_DISTANCE_RATIO;

          if (isClose) {
            const size = r * 2;
            const corner = size * 0.2;
            return (
              <RoundedRect
                key={`r-${cell.col}-${cell.row}`}
                x={cell.cx - r}
                y={cell.cy - r}
                width={size}
                height={size}
                r={corner}
                color={color}
                opacity={op}
              >
                <BlurMask blur={2 + (1 - falloff) * 8} style="normal" />
              </RoundedRect>
            );
          }

          return (
            <Circle
              key={`r-${cell.col}-${cell.row}`}
              cx={cell.cx}
              cy={cell.cy}
              r={r}
              color={color}
              opacity={op * 0.7}
            >
              <BlurMask
                blur={4 + (1 - falloff) * FAR_BLUR_MULTIPLIER}
                style="normal"
              />
            </Circle>
          );
        })}

        {/* ═══ LAYER 3: Bright edge particles — hug the face contour ═══ */}
        {rasterData
          .filter(({ dist }) => dist < 30)
          .map(({ cell, dist, zoneColor }) => {
            const edgeFalloff = 1 - dist / 30;
            const sparkle = 0.6 + 0.4 * Math.sin(t * 3 + cell.hash * 12);
            const r =
              CELL_SIZE *
              SPARKLE_RADIUS_RATIO *
              edgeFalloff *
              sparkle *
              visibility;
            if (r < SPARKLE_MIN_RADIUS) return null;
            return (
              <Circle
                key={`e-${cell.col}-${cell.row}`}
                cx={cell.cx}
                cy={cell.cy}
                r={r}
                color={lerpColor(zoneColor, "#FFFFFF", 0.4)}
                opacity={SPARKLE_OPACITY * edgeFalloff * sparkle * visibility}
              >
                <BlurMask blur={1.5} style="normal" />
              </Circle>
            );
          })}
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: { ...StyleSheet.absoluteFillObject, zIndex: 7 },
});
