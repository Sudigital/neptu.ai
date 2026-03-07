import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";

import type { AuraZone } from "../../hooks/useAuraData";

const { height: SCREEN_H } = Dimensions.get("window");
const BADGE_STAGGER = 120;
const BADGE_DURATION = 400;

interface AuraDimensionOverlayProps {
  zones: AuraZone[];
  dualitas: string;
  totalEnergy: number;
}

export function AuraDimensionOverlay({
  zones,
  dualitas,
  totalEnergy,
}: AuraDimensionOverlayProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Dualitas badge — top center */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(BADGE_DURATION)}
        style={styles.dualitasBadge}
      >
        <Text style={styles.dualitasText}>
          {dualitas === "YIN" ? "☯ YIN" : "☯ YANG"}
        </Text>
        <Text style={styles.energyText}>Energy: {totalEnergy}</Text>
      </Animated.View>

      {/* Dimension badges — positioned around the edges */}
      {zones.map((zone, index) => {
        const isLeft = index % 2 === 0;
        const entering = isLeft
          ? FadeInLeft.delay(BADGE_STAGGER * (index + 1)).duration(
              BADGE_DURATION
            )
          : FadeInRight.delay(BADGE_STAGGER * (index + 1)).duration(
              BADGE_DURATION
            );

        return (
          <Animated.View
            key={zone.key}
            entering={entering}
            style={[
              styles.dimensionBadge,
              isLeft ? styles.badgeLeft : styles.badgeRight,
              { top: getZoneTop(index) },
            ]}
          >
            <View
              style={[styles.badgeGlow, { backgroundColor: `${zone.color}30` }]}
            >
              <View style={styles.badgeRow}>
                <View
                  style={[styles.colorDot, { backgroundColor: zone.color }]}
                />
                <Text style={styles.badgeEmoji}>{zone.emoji}</Text>
                <View style={styles.badgeTextCol}>
                  <Text style={styles.badgeLabel}>{zone.label}</Text>
                  <Text
                    style={[styles.badgeZone, { color: `${zone.color}CC` }]}
                  >
                    {zone.bodyZone}
                  </Text>
                </View>
                <Text style={[styles.badgeScore, { color: zone.color }]}>
                  {zone.score}
                </Text>
              </View>
              {/* Intensity bar */}
              <View style={styles.intensityTrack}>
                <View
                  style={[
                    styles.intensityFill,
                    {
                      backgroundColor: zone.color,
                      width: `${Math.round(zone.intensity * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// Distribute zones vertically across the screen
const ZONE_TOP_START = 0.15;
const ZONE_SPACING = 0.14;

function getZoneTop(index: number): number {
  return Math.round((ZONE_TOP_START + index * ZONE_SPACING) * SCREEN_H);
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  dualitasBadge: {
    position: "absolute",
    top: "6%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  dualitasText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  energyText: {
    color: "#A855F7",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  dimensionBadge: {
    position: "absolute",
    width: "48%",
  },
  badgeLeft: {
    left: 8,
  },
  badgeRight: {
    right: 8,
  },
  badgeGlow: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeTextCol: {
    flex: 1,
  },
  badgeLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  badgeZone: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  badgeScore: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  intensityTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  intensityFill: {
    height: "100%",
    borderRadius: 2,
  },
});
