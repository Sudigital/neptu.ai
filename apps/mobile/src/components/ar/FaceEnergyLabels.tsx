import {
  Canvas,
  Line as SkLine,
  Circle,
  BlurMask,
  DashPathEffect,
  vec,
} from "@shopify/react-native-skia";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";

import type { AuraZone } from "../../hooks/useAuraData";
import type { FaceOutlineData } from "./FaceOutlineOverlay";

import { getFaceAnchors } from "./FaceOutlineOverlay";

const { width: SCREEN_W } = Dimensions.get("window");

const LABEL_W = 120;
const LABEL_OFFSET_X = 40;
const STAGGER_DELAY = 120;
const CONNECT_ELBOW_LEN = 16;
const LABEL_Y_OFFSET = 18;
const ANIMATION_DURATION = 350;

interface FaceEnergyLabelsProps {
  zones: AuraZone[];
  faces: FaceOutlineData[];
  dualitas: string;
  totalEnergy: number;
}

interface LabelPlacement {
  anchorKey:
    | "crown"
    | "eyeCenter"
    | "nose"
    | "mouth"
    | "chin"
    | "leftCheek"
    | "rightCheek";
  side: "left" | "right";
}

const ZONE_PLACEMENTS: Record<string, LabelPlacement> = {
  cipta: { anchorKey: "crown", side: "right" },
  rasa: { anchorKey: "leftCheek", side: "left" },
  karsa: { anchorKey: "nose", side: "right" },
  tindakan: { anchorKey: "rightCheek", side: "right" },
  frekuensi: { anchorKey: "chin", side: "left" },
};

interface LabelPos {
  anchorX: number;
  anchorY: number;
  elbowX: number;
  labelX: number;
  labelY: number;
  side: "left" | "right";
}

function computeLabelPositions(
  zones: AuraZone[],
  face: FaceOutlineData
): LabelPos[] {
  const anchors = getFaceAnchors(face);
  const { bounds } = face;

  return zones.map((zone) => {
    const placement = ZONE_PLACEMENTS[zone.key] ?? {
      anchorKey: "nose",
      side: "right",
    };
    const anchor = anchors[placement.anchorKey];
    const { side } = placement;

    // Elbow: horizontal jog out from face
    const elbowX =
      side === "left"
        ? Math.max(bounds.x - LABEL_OFFSET_X, 4 + LABEL_W)
        : Math.min(
            bounds.x + bounds.width + LABEL_OFFSET_X,
            SCREEN_W - 4 - LABEL_W
          );

    const labelX =
      side === "left"
        ? elbowX - LABEL_W - CONNECT_ELBOW_LEN
        : elbowX + CONNECT_ELBOW_LEN;
    const labelY = anchor.y - LABEL_Y_OFFSET;

    return {
      anchorX: anchor.x,
      anchorY: anchor.y,
      elbowX,
      labelX,
      labelY,
      side,
    };
  });
}

export function FaceEnergyLabels({
  zones,
  faces,
  dualitas: _dualitas,
  totalEnergy: _totalEnergy,
}: FaceEnergyLabelsProps) {
  if (faces.length === 0 || zones.length === 0) return null;

  const face = faces[0];
  const positions = computeLabelPositions(zones, face);

  return (
    <>
      {/* Skia canvas for connecting lines */}
      <Canvas style={styles.lineCanvas}>
        {positions.map((pos, i) => {
          const zone = zones[i];
          // L-shaped connecting line: anchor → elbow → label edge
          const labelEdgeX =
            pos.side === "left" ? pos.labelX + LABEL_W : pos.labelX;

          return (
            <View key={`lines-${zone.key}`}>
              {/* Anchor → elbow (horizontal) */}
              <SkLine
                p1={vec(pos.anchorX, pos.anchorY)}
                p2={vec(pos.elbowX, pos.anchorY)}
                color={`${zone.color}50`}
                strokeWidth={1}
                style="stroke"
              >
                <DashPathEffect intervals={[3, 3]} />
                <BlurMask blur={2} style="normal" />
              </SkLine>
              {/* Elbow → label (horizontal) */}
              <SkLine
                p1={vec(pos.elbowX, pos.anchorY)}
                p2={vec(labelEdgeX, pos.anchorY)}
                color={`${zone.color}70`}
                strokeWidth={1}
                style="stroke"
              >
                <BlurMask blur={1} style="normal" />
              </SkLine>
            </View>
          );
        })}

        {/* Dots at face anchor points */}
        {positions.map((pos, i) => (
          <Circle
            key={`dot-${zones[i].key}`}
            cx={pos.anchorX}
            cy={pos.anchorY}
            r={3.5}
            color={zones[i].color}
            opacity={0.9}
          >
            <BlurMask blur={5} style="normal" />
          </Circle>
        ))}

        {/* Glow dots at elbow points */}
        {positions.map((pos, i) => (
          <Circle
            key={`elbow-${zones[i].key}`}
            cx={pos.elbowX}
            cy={pos.anchorY}
            r={2}
            color={zones[i].color}
            opacity={0.6}
          >
            <BlurMask blur={3} style="normal" />
          </Circle>
        ))}
      </Canvas>

      {/* RN View labels */}
      <View style={styles.labelContainer} pointerEvents="none">
        {zones.map((zone, i) => {
          const pos = positions[i];
          const entering =
            pos.side === "left"
              ? FadeInLeft.delay(STAGGER_DELAY * (i + 1)).duration(
                  ANIMATION_DURATION
                )
              : FadeInRight.delay(STAGGER_DELAY * (i + 1)).duration(
                  ANIMATION_DURATION
                );
          return (
            <Animated.View
              key={zone.key}
              entering={entering}
              style={[
                styles.label,
                {
                  left: pos.labelX,
                  top: pos.labelY,
                  borderColor: `${zone.color}40`,
                },
              ]}
            >
              <View style={styles.labelHeader}>
                <View
                  style={[styles.colorDot, { backgroundColor: zone.color }]}
                />
                <Text style={styles.labelEmoji}>{zone.emoji}</Text>
                <Text style={styles.labelName} numberOfLines={1}>
                  {zone.label}
                </Text>
                <Text style={[styles.labelScore, { color: zone.color }]}>
                  {zone.score}
                </Text>
              </View>
              <Text style={[styles.labelZone, { color: `${zone.color}BB` }]}>
                {zone.bodyZone}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: zone.color,
                      width: `${Math.round(zone.intensity * 100)}%`,
                    },
                  ]}
                />
              </View>
            </Animated.View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lineCanvas: { ...StyleSheet.absoluteFillObject, zIndex: 9 },
  labelContainer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  label: {
    position: "absolute",
    width: LABEL_W,
    backgroundColor: "rgba(5,10,21,0.75)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
  },
  labelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  colorDot: { width: 5, height: 5, borderRadius: 2.5 },
  labelEmoji: { fontSize: 11 },
  labelName: {
    flex: 1,
    color: "#E8F0FF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  labelScore: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  labelZone: {
    fontSize: 7,
    fontWeight: "500",
    fontFamily: "monospace",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  barTrack: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 1,
    marginTop: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 1 },
});
