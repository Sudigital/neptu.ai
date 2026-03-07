import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutUp,
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const RESPONSE_MIN_HEIGHT = 300;
const RESPONSE_HEIGHT_RATIO = 0.72;
const RESPONSE_MAX_HEIGHT = SCREEN_HEIGHT * RESPONSE_HEIGHT_RATIO;
const SWIPE_VELOCITY_THRESHOLD = 0.5;
const ORB_FADE_IN_DURATION = 1200;
const PANEL_INSET = 16;
const PANEL_BOTTOM = 80;

import { ConversationHistory } from "../components/ConversationHistory";
import { NeptuOrb } from "../components/NeptuOrb";
import { COLORS, SOLANA_NETWORK } from "../constants";
import { useNeptuOracle } from "../hooks/useNeptuOracle";
import { useTypingEffect } from "../hooks/useTypingEffect";
import { dailyCheckIn } from "../services/voice-api";

interface OracleScreenProps {
  walletAddress: string;
}

const STATE_LABELS: Record<string, string> = {
  idle: "[ TAP ORB TO COMMUNE ]",
  listening: "[ RECEIVING INPUT... ]",
  thinking: "[ COSMIC ALIGNMENT... ]",
  speaking: "[ ORACLE SPEAKS ]",
  error: "[ SIGNAL DISRUPTED ]",
};

export function OracleScreen({ walletAddress }: OracleScreenProps) {
  const [showHistory, setShowHistory] = useState(false);

  const oracle = useNeptuOracle(walletAddress);

  // Auto daily check-in on first visit
  const checkedInRef = useRef(false);
  useEffect(() => {
    if (!checkedInRef.current) {
      checkedInRef.current = true;
      dailyCheckIn(walletAddress).catch(() => {
        /* already checked in or offline — ignore */
      });
    }
  }, [walletAddress]);

  // Reward toast state
  const [rewardToast, setRewardToast] = useState<number | null>(null);
  const prevRewardRef = useRef(0);

  useEffect(() => {
    if (
      oracle.lastRewardEarned > 0 &&
      oracle.lastRewardEarned !== prevRewardRef.current
    ) {
      prevRewardRef.current = oracle.lastRewardEarned;
      setRewardToast(oracle.lastRewardEarned);
      const timer = setTimeout(() => setRewardToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [oracle.lastRewardEarned]);

  const isOrbDisabled =
    oracle.orbState === "thinking" || oracle.orbState === "speaking";

  const handleOrbPress = useCallback(() => {
    if (oracle.orbState === "idle") {
      oracle.startConversation();
    } else if (oracle.orbState === "listening") {
      oracle.stopConversation();
    }
  }, [oracle]);

  // Typing effect for the oracle response
  const hasResponse = !!(
    oracle.lastResponse &&
    (oracle.orbState === "idle" || oracle.orbState === "speaking")
  );
  const responseText = oracle.lastResponse?.response ?? "";
  const typedResponse = useTypingEffect(responseText, hasResponse);
  const isTyping = hasResponse && typedResponse.length < responseText.length;

  // Draggable response panel — ref tracks live height so PanResponder stays stable
  const [panelHeight, setPanelHeight] = useState(RESPONSE_MIN_HEIGHT);
  const heightRef = useRef(RESPONSE_MIN_HEIGHT);
  const dragStartRef = useRef(RESPONSE_MIN_HEIGHT);

  // Keep ref in sync with state
  useEffect(() => {
    heightRef.current = panelHeight;
  }, [panelHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gs) => Math.abs(gs.dy) > 5,
        onPanResponderGrant: () => {
          dragStartRef.current = heightRef.current;
        },
        onPanResponderMove: (_evt, gs) => {
          const next = dragStartRef.current - gs.dy;
          const clamped = Math.max(
            RESPONSE_MIN_HEIGHT,
            Math.min(RESPONSE_MAX_HEIGHT, next)
          );
          heightRef.current = clamped;
          setPanelHeight(clamped);
        },
        onPanResponderRelease: (_evt, gs) => {
          if (gs.vy > SWIPE_VELOCITY_THRESHOLD) {
            heightRef.current = RESPONSE_MIN_HEIGHT;
            setPanelHeight(RESPONSE_MIN_HEIGHT);
          } else if (gs.vy < -SWIPE_VELOCITY_THRESHOLD) {
            heightRef.current = RESPONSE_MAX_HEIGHT;
            setPanelHeight(RESPONSE_MAX_HEIGHT);
          }
        },
      }),
    [] // stable — uses refs only
  );

  // Reset panel height when response disappears
  useEffect(() => {
    if (!hasResponse) {
      heightRef.current = RESPONSE_MIN_HEIGHT;
      setPanelHeight(RESPONSE_MIN_HEIGHT);
    }
  }, [hasResponse]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen centered layout — orb is always centered */}
      <View style={styles.centerStage}>
        {/* Orb — always center */}
        <Animated.View
          entering={FadeIn.duration(ORB_FADE_IN_DURATION)}
          style={styles.orbArea}
        >
          <NeptuOrb
            orbState={oracle.orbState}
            amplitude={oracle.amplitude}
            onPress={handleOrbPress}
            disabled={isOrbDisabled}
            conversationsUsed={oracle.conversationsUsed}
            freeRemaining={oracle.freeRemaining}
          />
        </Animated.View>

        {/* Status text — below orb */}
        <Text
          style={[
            styles.statusText,
            oracle.orbState === "listening" && styles.statusActive,
            oracle.orbState === "error" && styles.statusError,
          ]}
        >
          {STATE_LABELS[oracle.orbState] ?? STATE_LABELS.idle}
        </Text>

        {/* Reward toast — floats above response */}
        {rewardToast !== null && (
          <Animated.View
            entering={FadeInUp.duration(400)}
            exiting={FadeOutUp.duration(300)}
            style={styles.rewardToast}
          >
            <Text style={styles.rewardToastText}>+{rewardToast} NEPTU ✨</Text>
          </Animated.View>
        )}
      </View>

      {/* Response overlay — draggable panel, overlaps below the orb */}
      {hasResponse && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          exiting={FadeOutDown.duration(300)}
          style={[styles.responseOverlay, { height: panelHeight }]}
        >
          {/* Close button — visible when audio stops */}
          {!oracle.isAudioPlaying && (
            <TouchableOpacity
              style={styles.closeResponseButton}
              onPress={oracle.clearLastResponse}
              activeOpacity={0.7}
            >
              <Text style={styles.closeResponseText}>{"\u2715"}</Text>
            </TouchableOpacity>
          )}

          {/* Drag handle — 3-line grip */}
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <View style={styles.gripLines}>
              <View style={styles.gripLine} />
              <View style={styles.gripLine} />
              <View style={styles.gripLine} />
            </View>
            <View style={styles.lineAccent} />
          </View>

          <View style={styles.responseCard}>
            {/* Transcript (what user said) */}
            {oracle.lastResponse?.transcript ? (
              <View style={styles.transcriptRow}>
                <View style={styles.transcriptDot} />
                <Text style={styles.transcriptText} numberOfLines={2}>
                  {oracle.lastResponse.transcript}
                </Text>
              </View>
            ) : null}

            {/* Separator line */}
            <View style={styles.lineSeparator} />

            {/* Oracle response — typing effect, fills available space */}
            <ScrollView
              style={styles.responseScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.responseText}>
                {typedResponse}
                {isTyping && <Text style={styles.cursor}>▌</Text>}
              </Text>
            </ScrollView>

            {/* Action row */}
            <View style={styles.responseActions}>
              {oracle.lastResponse?.audioBase64 ? (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    oracle.isAudioPlaying && styles.actionButtonActive,
                  ]}
                  onPress={oracle.replayAudio}
                  disabled={oracle.isAudioPlaying}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>
                    {oracle.isAudioPlaying ? "◉ PLAYING" : "▶ PLAY"}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Reward badge inline */}
              {oracle.lastRewardEarned > 0 && (
                <View style={styles.rewardBadge}>
                  <Text style={styles.rewardBadgeText}>
                    +{oracle.lastRewardEarned}{" "}
                    {SOLANA_NETWORK === "mainnet" ? "SKR" : "SUDIGITAL"}
                  </Text>
                </View>
              )}

              {oracle.history.length > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowHistory(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>
                    ◇ {oracle.history.length}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Error */}
      {oracle.error && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.errorContainer}
        >
          <Text style={styles.errorText}>{oracle.error}</Text>
        </Animated.View>
      )}

      {/* History panel */}
      <ConversationHistory
        history={oracle.history}
        visible={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  orbArea: { alignItems: "center", justifyContent: "center" },
  statusText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    fontFamily: "monospace",
    letterSpacing: 3,
    marginTop: 12,
    textTransform: "uppercase",
  },
  statusActive: { color: COLORS.primary },
  statusError: { color: COLORS.error },
  rewardToast: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: `${COLORS.success}60`,
    backgroundColor: `${COLORS.success}15`,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  rewardToastText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  responseOverlay: {
    position: "absolute",
    bottom: PANEL_BOTTOM,
    left: PANEL_INSET,
    right: PANEL_INSET,
    borderRadius: 16,
    backgroundColor: `${COLORS.background}F4`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}18`,
    overflow: "hidden",
    zIndex: 20,
  },
  closeResponseButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    backgroundColor: `${COLORS.surface}90`,
    zIndex: 30,
  },
  closeResponseText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  dragHandle: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: "center",
  },
  gripLines: { alignItems: "center", gap: 3, marginBottom: 8 },
  gripLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: `${COLORS.primary}50`,
  },
  lineAccent: {
    height: 1,
    alignSelf: "stretch",
    backgroundColor: COLORS.primary,
    marginHorizontal: 24,
    opacity: 0.35,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  responseCard: { flex: 1, padding: 16, paddingBottom: 24 },
  transcriptRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  transcriptDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 5,
  },
  transcriptText: {
    flex: 1,
    color: `${COLORS.accent}90`,
    fontSize: 11,
    fontFamily: "monospace",
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  lineSeparator: {
    height: 1,
    backgroundColor: `${COLORS.primary}12`,
    marginBottom: 10,
  },
  responseScroll: { flex: 1 },
  responseText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  cursor: { color: COLORS.primary, fontSize: 13, opacity: 0.8 },
  responseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.primary}10`,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${COLORS.primary}08`,
  },
  actionButtonActive: {
    borderColor: `${COLORS.accent}60`,
    backgroundColor: `${COLORS.accent}15`,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1,
  },
  rewardBadge: {
    borderWidth: 1,
    borderColor: `${COLORS.success}40`,
    backgroundColor: `${COLORS.success}08`,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rewardBadgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  errorContainer: {
    position: "absolute",
    bottom: 96,
    left: 24,
    right: 24,
    zIndex: 25,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    textAlign: "center",
    fontFamily: "monospace",
    letterSpacing: 1,
    padding: 10,
    backgroundColor: `${COLORS.background}E0`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
    overflow: "hidden",
  },
});
