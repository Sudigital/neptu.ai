import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import ViewShot from "react-native-view-shot";

import type { FaceOutlineData } from "./FaceOutlineOverlay";

import { useAuraData } from "../../hooks/useAuraData";
import { styles } from "./ARAuraScannerStyles";
import {
  SCREEN_W,
  SCREEN_H,
  getScanPhaseText,
  transformFaceForCover,
} from "./aura-scanner-utils";
import { FaceAuraEffect } from "./FaceAuraEffect";
import { FaceEnergyLabels } from "./FaceEnergyLabels";
import { FaceOutlineOverlay } from "./FaceOutlineOverlay";

// Lazy-load vision-camera + face detector
type UseCameraDeviceFn = (position: "front" | "back") => { id: string } | null;
type UseCameraPermissionFn = () => {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
};

let FDCameraComponent: React.ComponentType<Record<string, unknown>> | null =
  null;
let vcUseCameraDevice: UseCameraDeviceFn | null = null;
let vcUseCameraPermission: UseCameraPermissionFn | null = null;
let cameraAvailable = false;

try {
  const vc = require("react-native-vision-camera");
  const fd = require("react-native-vision-camera-face-detector");
  FDCameraComponent = fd.Camera;
  vcUseCameraDevice = vc.useCameraDevice;
  vcUseCameraPermission = vc.useCameraPermission;
  cameraAvailable = true;
} catch {
  // Native modules not available
}

// Scan phases
type ScanPhase = "idle" | "scanning" | "result";

const SCAN_DURATION_MS = 3500;
const SCAN_TICK_MS = 40;
const SCAN_TOTAL_TICKS = Math.ceil(SCAN_DURATION_MS / SCAN_TICK_MS);
const HAPTIC_INTERVAL = 12; // tick interval between haptic pulses

const FACE_DETECTION_OPTIONS = {
  performanceMode: "fast" as const,
  contourMode: "all" as const,
  landmarkMode: "all" as const,
  classificationMode: "none" as const,
  minFaceSize: 0.2,
  trackingEnabled: false,
  autoMode: true,
  windowWidth: SCREEN_W,
  windowHeight: SCREEN_H,
};

interface ARAuraScannerProps {
  onBack: () => void;
}

function ARAuraScannerCamera({ onBack }: ARAuraScannerProps) {
  const device = vcUseCameraDevice!("front");
  const { hasPermission, requestPermission } = vcUseCameraPermission!();

  const auraData = useAuraData();
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [, setScanTick] = useState(0);
  const [faces, setFaces] = useState<FaceOutlineData[]>([]);
  const [frozenFaces, setFrozenFaces] = useState<FaceOutlineData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef(null);
  const viewShotRef = useRef<ViewShot>(null);
  const facesRef = useRef<FaceOutlineData[]>([]);

  const handleFacesDetected = useCallback(
    (
      detectedFaces: FaceOutlineData[],
      frame?: { width: number; height: number }
    ) => {
      const corrected =
        frame && frame.width > 0 && frame.height > 0
          ? detectedFaces.map((f) =>
              transformFaceForCover(f, frame.width, frame.height)
            )
          : detectedFaces;
      facesRef.current = corrected;
      setFaces(corrected);
    },
    []
  );

  // Start scan
  const startScan = useCallback(() => {
    if (faces.length === 0) return;
    setPhase("scanning");
    setScanProgress(0);
    setScanTick(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [faces.length]);

  // Re-scan
  const reScan = useCallback(() => {
    setPhase("idle");
    setScanProgress(0);
    setScanTick(0);
    setFrozenFaces([]);
    setIsSaving(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Capture composited view (camera + aura overlay + labels)
  const captureAndShare = useCallback(async () => {
    if (!viewShotRef.current?.capture) return;
    setIsSaving(true);
    try {
      const uri = await viewShotRef.current.capture();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save to gallery
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.saveToLibraryAsync(uri);
      }

      // Open native share sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your Aura Scan",
        });
      } else {
        Alert.alert("Saved!", "Aura scan saved to your gallery.");
      }
    } catch {
      Alert.alert("Error", "Could not capture the aura scan.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Scanning animation loop
  useEffect(() => {
    if (phase !== "scanning") return;

    let tick = 0;
    tickRef.current = setInterval(() => {
      tick++;
      const progress = Math.min(tick / SCAN_TOTAL_TICKS, 1);
      setScanProgress(progress);
      setScanTick(tick);

      // Haptic pulses during scan
      if (tick % HAPTIC_INTERVAL === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Scan complete
      if (tick >= SCAN_TOTAL_TICKS) {
        if (tickRef.current) clearInterval(tickRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Freeze current face data for result display
        const latestFaces = facesRef.current;
        setFrozenFaces((prev) => (latestFaces.length > 0 ? latestFaces : prev));
        setPhase("result");
      }
    }, SCAN_TICK_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase]);

  // The faces to display depend on phase
  const displayFaces = phase === "result" ? frozenFaces : faces;
  const showOutline = phase === "scanning" || phase === "result";
  const showLabels = phase === "result";

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>No Front Camera</Text>
        <Text style={styles.permissionText}>
          Could not find a front-facing camera device.
        </Text>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← Back to AR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          The Aura Scanner needs your camera to detect your face and overlay
          energy visualizations.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← Back to AR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const FDCamera = FDCameraComponent!;

  return (
    <View style={styles.container}>
      {/* ViewShot wraps camera + overlays for composited capture */}
      <ViewShot
        ref={viewShotRef}
        style={styles.viewShot}
        options={{ format: "png", quality: 1 }}
      >
        {/* Camera feed */}
        <FDCamera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive
          faceDetectionOptions={FACE_DETECTION_OPTIONS}
          faceDetectionCallback={handleFacesDetected}
        />

        {/* Aura energy effect — builds during scanning, full in result */}
        {(phase === "scanning" || phase === "result") && (
          <FaceAuraEffect
            faces={displayFaces}
            zones={auraData.zones}
            phase={phase}
            scanProgress={scanProgress}
          />
        )}

        {/* Face outline — during scanning (progressive) & result (full) */}
        {showOutline && (
          <FaceOutlineOverlay
            faces={displayFaces}
            scanProgress={scanProgress}
            phase={phase}
          />
        )}

        {/* Energy labels — only in result phase */}
        {showLabels && (
          <FaceEnergyLabels
            zones={auraData.zones}
            faces={displayFaces}
            dualitas={auraData.dualitas}
            totalEnergy={auraData.totalEnergy}
          />
        )}
      </ViewShot>

      {/* Controls overlay */}
      <View style={styles.controls} pointerEvents="box-none">
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* ═══ IDLE phase ═══ */}
        {phase === "idle" && (
          <>
            {faces.length > 0 && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.faceDetectedBadge}
              >
                <View style={styles.faceDot} />
                <Text style={styles.faceDetectedText}>FACE DETECTED</Text>
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              style={styles.scanButtonArea}
            >
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  faces.length === 0 && styles.scanButtonDisabled,
                ]}
                onPress={startScan}
                activeOpacity={0.8}
                disabled={faces.length === 0}
              >
                <Text style={styles.scanButtonText}>SCAN AURA</Text>
              </TouchableOpacity>
              <Text style={styles.scanHint}>
                {faces.length === 0
                  ? "Position your face in the camera"
                  : "Tap to begin energy scan"}
              </Text>
            </Animated.View>
          </>
        )}

        {/* ═══ SCANNING phase ═══ */}
        {phase === "scanning" && (
          <>
            {/* Progress bar */}
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.progressContainer}
            >
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(scanProgress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(scanProgress * 100)}%
              </Text>
            </Animated.View>

            {/* Scanning badge */}
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.scanningBadge}
            >
              <View style={styles.scanDot} />
              <Text style={styles.scanningText}>
                {getScanPhaseText(scanProgress)}
              </Text>
            </Animated.View>
          </>
        )}

        {/* ═══ RESULT phase ═══ */}
        {phase === "result" && (
          <>
            {/* Result header */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.resultHeader}
            >
              <Text style={styles.resultTitle}>AURA SCAN COMPLETE</Text>
              <Text style={styles.resultSubtitle}>
                {auraData.dualitas === "YIN" ? "☯ YIN" : "☯ YANG"} · ⚡{" "}
                {auraData.totalEnergy}
              </Text>
            </Animated.View>

            {/* Action buttons */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(400)}
              style={styles.rescanButtonArea}
            >
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={reScan}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rescanButtonText}>RE-SCAN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    isSaving && styles.captureButtonDisabled,
                  ]}
                  onPress={captureAndShare}
                  activeOpacity={0.8}
                  disabled={isSaving}
                >
                  <Text style={styles.captureButtonText}>
                    {isSaving ? "SAVING..." : "📸 CAPTURE"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

export function ARAuraScanner({ onBack }: ARAuraScannerProps) {
  if (!cameraAvailable) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Native Rebuild Required</Text>
        <Text style={styles.permissionText}>
          Camera + face detection modules need a native rebuild.{"\n"}
          Run: expo run:android
        </Text>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← Back to AR</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <ARAuraScannerCamera onBack={onBack} />;
}
