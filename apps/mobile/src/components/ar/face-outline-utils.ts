import { Skia } from "@shopify/react-native-skia";

export interface Point {
  x: number;
  y: number;
}

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceContours {
  FACE: Point[];
  LEFT_EYE: Point[];
  RIGHT_EYE: Point[];
  LEFT_EYEBROW_TOP: Point[];
  LEFT_EYEBROW_BOTTOM: Point[];
  RIGHT_EYEBROW_TOP: Point[];
  RIGHT_EYEBROW_BOTTOM: Point[];
  NOSE_BRIDGE: Point[];
  NOSE_BOTTOM: Point[];
  UPPER_LIP_TOP: Point[];
  UPPER_LIP_BOTTOM: Point[];
  LOWER_LIP_TOP: Point[];
  LOWER_LIP_BOTTOM: Point[];
  LEFT_CHEEK: Point[];
  RIGHT_CHEEK: Point[];
}

export interface FaceLandmarks {
  LEFT_EYE: Point;
  RIGHT_EYE: Point;
  NOSE_BASE: Point;
  MOUTH_LEFT: Point;
  MOUTH_RIGHT: Point;
  MOUTH_BOTTOM: Point;
  LEFT_EAR: Point;
  RIGHT_EAR: Point;
  LEFT_CHEEK: Point;
  RIGHT_CHEEK: Point;
}

export interface FaceOutlineData {
  bounds: FaceBounds;
  contours?: FaceContours;
  landmarks?: FaceLandmarks;
}

// Neon color palette
export const NEON = {
  face: "#A855F7",
  eye: "#06B6D4",
  eyebrow: "#8B5CF6",
  nose: "#C4B5FD",
  lip: "#EC4899",
  scan: "#A855F7",
  corner: "#A855F7",
};

// Extracted numeric constants
export const CORNER_LENGTH_RATIO = 0.14;
export const CHEEK_X_RATIO = 0.8;
export const GLOW_MULTIPLIER = 1.4;
export const CORNER_OPACITY = 0.85;
export const STROKE_OPACITY = 0.35;
export const FEATURE_OPACITY = 0.9;
export const FEATURE_STROKE_WIDTH = 2.5;
export const LOW_OPACITY = 0.25;
export const HIGH_OPACITY = 0.85;
export const SCAN_BEAM_OPACITY = 0.8;
export const LABEL_LINE_OPACITY = 0.35;

// Trim a closed Skia path to show only first N% of its length
export function trimPath(
  path: ReturnType<typeof Skia.Path.Make>,
  fraction: number
) {
  if (fraction >= 1) return path;
  const trimmed = path.copy();
  trimmed.trim(0, Math.max(0.001, fraction), false);
  return trimmed;
}

export function buildSmoothClosed(pts: Point[]) {
  const path = Skia.Path.Make();
  const n = pts.length;
  if (n < 3) return buildClosedLinear(pts);
  const startX = (pts[0].x + pts[n - 1].x) / 2;
  const startY = (pts[0].y + pts[n - 1].y) / 2;
  path.moveTo(startX, startY);
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    path.quadTo(curr.x, curr.y, midX, midY);
  }
  path.close();
  return path;
}

export function buildSmoothOpen(pts: Point[]) {
  const path = Skia.Path.Make();
  if (pts.length < 2) return path;
  if (pts.length === 2) {
    path.moveTo(pts[0].x, pts[0].y);
    path.lineTo(pts[1].x, pts[1].y);
    return path;
  }
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    if (i === 0) path.lineTo(midX, midY);
    else path.quadTo(curr.x, curr.y, midX, midY);
  }
  const last = pts[pts.length - 1];
  path.lineTo(last.x, last.y);
  return path;
}

export function buildClosedLinear(pts: Point[]) {
  const path = Skia.Path.Make();
  if (pts.length < 3) return path;
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);
  path.close();
  return path;
}

export function buildCornerPaths(b: FaceBounds) {
  const L = Math.min(20, b.width * CORNER_LENGTH_RATIO);
  const coords = [
    [
      { x: b.x, y: b.y + L },
      { x: b.x, y: b.y },
      { x: b.x + L, y: b.y },
    ],
    [
      { x: b.x + b.width - L, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x + b.width, y: b.y + L },
    ],
    [
      { x: b.x + b.width, y: b.y + b.height - L },
      { x: b.x + b.width, y: b.y + b.height },
      { x: b.x + b.width - L, y: b.y + b.height },
    ],
    [
      { x: b.x + L, y: b.y + b.height },
      { x: b.x, y: b.y + b.height },
      { x: b.x, y: b.y + b.height - L },
    ],
  ];
  return coords.map((c) => {
    const p = Skia.Path.Make();
    p.moveTo(c[0].x, c[0].y);
    p.lineTo(c[1].x, c[1].y);
    p.lineTo(c[2].x, c[2].y);
    return p;
  });
}

export function contourCenter(pts: Point[]): Point {
  const sum = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / pts.length, y: sum.y / pts.length };
}

export function getFaceAnchors(face: FaceOutlineData) {
  const { bounds, contours, landmarks } = face;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  const crown = contours?.FACE
    ? { x: cx, y: Math.min(...contours.FACE.map((p) => p.y)) - 20 }
    : { x: cx, y: bounds.y - 20 };

  let eyeCenter: Point;
  if (contours) {
    eyeCenter = {
      x:
        (contourCenter(contours.LEFT_EYE).x +
          contourCenter(contours.RIGHT_EYE).x) /
        2,
      y:
        (contourCenter(contours.LEFT_EYE).y +
          contourCenter(contours.RIGHT_EYE).y) /
        2,
    };
  } else if (landmarks) {
    eyeCenter = {
      x: (landmarks.LEFT_EYE.x + landmarks.RIGHT_EYE.x) / 2,
      y: (landmarks.LEFT_EYE.y + landmarks.RIGHT_EYE.y) / 2,
    };
  } else {
    eyeCenter = { x: cx, y: cy - bounds.height * 0.15 };
  }

  const nose = contours?.NOSE_BOTTOM
    ? contourCenter(contours.NOSE_BOTTOM)
    : (landmarks?.NOSE_BASE ?? { x: cx, y: cy });

  let mouth: Point;
  if (contours?.UPPER_LIP_TOP) {
    mouth = contourCenter([
      ...contours.UPPER_LIP_TOP,
      ...(contours.LOWER_LIP_BOTTOM ?? []),
    ]);
  } else if (landmarks) {
    mouth = {
      x: (landmarks.MOUTH_LEFT.x + landmarks.MOUTH_RIGHT.x) / 2,
      y: landmarks.MOUTH_BOTTOM.y - 5,
    };
  } else {
    mouth = { x: cx, y: cy + bounds.height * 0.2 };
  }

  const chin = contours?.FACE
    ? { x: cx, y: Math.max(...contours.FACE.map((p) => p.y)) }
    : { x: cx, y: bounds.y + bounds.height };

  const leftCheek = contours?.LEFT_CHEEK
    ? contourCenter(contours.LEFT_CHEEK)
    : (landmarks?.LEFT_CHEEK ?? { x: bounds.x + bounds.width * 0.2, y: cy });

  const rightCheek = contours?.RIGHT_CHEEK
    ? contourCenter(contours.RIGHT_CHEEK)
    : (landmarks?.RIGHT_CHEEK ?? {
        x: bounds.x + bounds.width * CHEEK_X_RATIO,
        y: cy,
      });

  return { crown, eyeCenter, nose, mouth, chin, leftCheek, rightCheek, cx, cy };
}

// Progressive reveal helper: feature reveals at a specific progress threshold
export function featureVisible(scanProgress: number, threshold: number) {
  return scanProgress >= threshold;
}

// Feature opacity ramps from 0 to full over a small range above threshold
export function featureOpacity(
  scanProgress: number,
  threshold: number,
  isResult: boolean
) {
  if (isResult) return 1;
  if (scanProgress < threshold) return 0;
  return Math.min(1, (scanProgress - threshold) / 0.15);
}
