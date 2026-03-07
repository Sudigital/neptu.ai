import { Dimensions } from "react-native";

import type {
  FaceOutlineData,
  FaceContours,
  FaceLandmarks,
} from "./FaceOutlineOverlay";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export { SCREEN_W, SCREEN_H };

export type Pt = { x: number; y: number };

export const COVER_THRESHOLD = 0.01;
export const SCAN_PHASE_DETECT = 0.3;
export const SCAN_PHASE_READ = 0.7;

// Cover-mode correction: autoMode stretches coordinates to fill screen independently
// per axis, but the camera preview uses "cover" (uniform scale + crop). This corrects
// face coordinates so overlays align precisely with the preview.
export function computeCoverCorrection(frameW: number, frameH: number) {
  // Native face detector swaps dims for portrait: sourceW = image.height, sourceH = image.width
  const sourceW = frameH;
  const sourceH = frameW;
  const stretchX = SCREEN_W / sourceW;
  const stretchY = SCREEN_H / sourceH;
  const cover = Math.max(stretchX, stretchY);
  return {
    rX: cover / stretchX,
    rY: cover / stretchY,
    offX: (SCREEN_W - sourceW * cover) / 2,
    offY: (SCREEN_H - sourceH * cover) / 2,
  };
}

export function getScanPhaseText(progress: number): string {
  if (progress < SCAN_PHASE_DETECT) return "DETECTING FEATURES";
  if (progress < SCAN_PHASE_READ) return "READING ENERGY";
  return "ANALYZING AURA";
}

export function transformFaceForCover(
  face: FaceOutlineData,
  frameW: number,
  frameH: number
): FaceOutlineData {
  const { rX, rY, offX, offY } = computeCoverCorrection(frameW, frameH);
  if (Math.abs(rX - 1) < COVER_THRESHOLD && Math.abs(rY - 1) < COVER_THRESHOLD)
    return face;

  const tp = (p: Pt): Pt => ({ x: p.x * rX + offX, y: p.y * rY + offY });
  const tpa = (pts: Pt[]) => pts.map(tp);

  const { x, y } = tp({ x: face.bounds.x, y: face.bounds.y });
  const bounds = {
    x,
    y,
    width: face.bounds.width * rX,
    height: face.bounds.height * rY,
  };

  let contours: FaceContours | undefined;
  if (face.contours) {
    const s = face.contours;
    contours = {
      FACE: tpa(s.FACE),
      LEFT_EYE: tpa(s.LEFT_EYE),
      RIGHT_EYE: tpa(s.RIGHT_EYE),
      LEFT_EYEBROW_TOP: tpa(s.LEFT_EYEBROW_TOP),
      LEFT_EYEBROW_BOTTOM: tpa(s.LEFT_EYEBROW_BOTTOM),
      RIGHT_EYEBROW_TOP: tpa(s.RIGHT_EYEBROW_TOP),
      RIGHT_EYEBROW_BOTTOM: tpa(s.RIGHT_EYEBROW_BOTTOM),
      NOSE_BRIDGE: tpa(s.NOSE_BRIDGE),
      NOSE_BOTTOM: tpa(s.NOSE_BOTTOM),
      UPPER_LIP_TOP: tpa(s.UPPER_LIP_TOP),
      UPPER_LIP_BOTTOM: tpa(s.UPPER_LIP_BOTTOM),
      LOWER_LIP_TOP: tpa(s.LOWER_LIP_TOP),
      LOWER_LIP_BOTTOM: tpa(s.LOWER_LIP_BOTTOM),
      LEFT_CHEEK: tpa(s.LEFT_CHEEK),
      RIGHT_CHEEK: tpa(s.RIGHT_CHEEK),
    };
  }

  let landmarks: FaceLandmarks | undefined;
  if (face.landmarks) {
    const l = face.landmarks;
    landmarks = {
      LEFT_EYE: tp(l.LEFT_EYE),
      RIGHT_EYE: tp(l.RIGHT_EYE),
      NOSE_BASE: tp(l.NOSE_BASE),
      MOUTH_LEFT: tp(l.MOUTH_LEFT),
      MOUTH_RIGHT: tp(l.MOUTH_RIGHT),
      MOUTH_BOTTOM: tp(l.MOUTH_BOTTOM),
      LEFT_EAR: tp(l.LEFT_EAR),
      RIGHT_EAR: tp(l.RIGHT_EAR),
      LEFT_CHEEK: tp(l.LEFT_CHEEK),
      RIGHT_CHEEK: tp(l.RIGHT_CHEEK),
    };
  }

  return { bounds, contours, landmarks };
}
