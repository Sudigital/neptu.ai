import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ARFeatureConfig } from "../constants/aura";
import type { ARView } from "../types";

import { ARAuraScanner } from "../components/ar/ARAuraScanner";
import { AR_FEATURES } from "../constants/aura";
import { useTheme } from "../hooks/useTheme";
import { OracleScreen } from "./OracleScreen";

const CARD_H_PADDING = 20;
const HEADER_FADE_DURATION = 600;
const CARD_STAGGER_BASE = 200;
const CARD_STAGGER_STEP = 80;
const LOCK_ICON_SIZE = 32;
const TAB_BAR_CLEARANCE = 120;

const DARK_DISABLED_GRADIENT = ["#1A1A2E", "#0F0F1A"];
const LIGHT_DISABLED_GRADIENT = ["#E5E7EB", "#D1D5DB"];

function getDisabledGradient(isDark: boolean): string[] {
  return isDark ? DARK_DISABLED_GRADIENT : LIGHT_DISABLED_GRADIENT;
}

interface ARScreenProps {
  walletAddress: string;
  onSubScreenChange?: (isSubScreen: boolean) => void;
}

export function ARScreen({ walletAddress, onSubScreenChange }: ARScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeView, setActiveView] = useState<ARView>("list");

  const handleFeaturePress = useCallback(
    (feature: ARFeatureConfig) => {
      if (!feature.available) return;
      setActiveView(feature.id);
      onSubScreenChange?.(true);
    },
    [onSubScreenChange]
  );

  const handleBack = useCallback(() => {
    setActiveView("list");
    onSubScreenChange?.(false);
  }, [onSubScreenChange]);

  // Sub-screen: Aura Scanner
  if (activeView === "aura") {
    return <ARAuraScanner onBack={handleBack} />;
  }

  // Sub-screen: Oracle (accessible from AR hub)
  if (activeView === "orb") {
    return (
      <View style={styles.subScreen}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { top: insets.top + 8, backgroundColor: `${colors.surface}CC` },
          ]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <OracleScreen walletAddress={walletAddress} />
      </View>
    );
  }

  // Future: other AR sub-screens (aura, garden, etc.) will go here

  // Default: feature list
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(HEADER_FADE_DURATION)}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AR Experiences
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Bring your spiritual wellness into the real world
          </Text>
        </Animated.View>

        {/* Feature cards */}
        {AR_FEATURES.map((feature, index) => (
          <Animated.View
            key={feature.id}
            entering={FadeInUp.delay(
              CARD_STAGGER_BASE + index * CARD_STAGGER_STEP
            ).duration(400)}
          >
            <TouchableOpacity
              style={[
                styles.featureCard,
                {
                  borderColor: feature.available
                    ? `${colors.primary}30`
                    : `${colors.textMuted}15`,
                },
              ]}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={feature.available ? 0.7 : 1}
              disabled={!feature.available}
            >
              <LinearGradient
                colors={
                  feature.available
                    ? feature.gradient
                    : getDisabledGradient(isDark)
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {/* Icon + content */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardIcon}>{feature.icon}</Text>
                  <View style={styles.cardTextArea}>
                    <View style={styles.cardTitleRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          {
                            color: feature.available
                              ? "#FFFFFF"
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {feature.title}
                      </Text>
                      {!feature.available && (
                        <View
                          style={[
                            styles.phaseBadge,
                            { backgroundColor: `${colors.primary}20` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.phaseText,
                              { color: colors.primary },
                            ]}
                          >
                            {feature.phase}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        {
                          color: feature.available
                            ? "#FFFFFFBB"
                            : colors.textMuted,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {feature.subtitle}
                    </Text>
                  </View>
                </View>

                {/* Lock overlay for unavailable */}
                {!feature.available && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text
                      style={[styles.lockText, { color: colors.textMuted }]}
                    >
                      Coming Soon
                    </Text>
                  </View>
                )}

                {/* Arrow for available */}
                {feature.available && (
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Oracle quick access */}
        <Animated.View
          entering={FadeInUp.delay(
            CARD_STAGGER_BASE + AR_FEATURES.length * CARD_STAGGER_STEP
          ).duration(400)}
        >
          <TouchableOpacity
            style={[styles.oracleCard, { borderColor: `${colors.accent}30` }]}
            onPress={() => {
              setActiveView("orb");
              onSubScreenChange?.(true);
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={isDark ? ["#1A0A2E", "#0A0518"] : ["#F3E8FF", "#E8D5FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardBody}>
                <Text style={styles.cardIcon}>🔮</Text>
                <View style={styles.cardTextArea}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: isDark ? colors.accent : "#7C3AED" },
                    ]}
                  >
                    Oracle Voice
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Talk to Neptu — your spiritual AI guide
                  </Text>
                </View>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={[styles.arrowText, { color: colors.accent }]}>
                  →
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subScreen: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 100,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_H_PADDING,
    gap: 14,
  },
  header: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  featureCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  oracleCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    minHeight: 88,
  },
  cardBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIcon: {
    fontSize: 36,
  },
  cardTextArea: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.1,
  },
  phaseBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  phaseText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: "monospace",
  },
  lockOverlay: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  lockIcon: {
    fontSize: LOCK_ICON_SIZE,
    opacity: 0.5,
  },
  lockText: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  arrowContainer: {
    paddingLeft: 8,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFFCC",
  },
});
