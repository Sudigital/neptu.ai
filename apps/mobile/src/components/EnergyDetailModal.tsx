import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { ReadingData, CardTheme } from "../utils/energy-helpers";

import { useTheme } from "../hooks/useTheme";
import { getProfile } from "../services/storage";
import { askOracle } from "../services/voice-api";
import {
  INTEREST_ICONS,
  INTEREST_LABELS,
  parseInsights,
} from "../utils/interest-helpers";
import {
  SLIDE_GAP,
  SLIDE_SNAP,
  SLIDE_WIDTH,
  styles,
} from "./EnergyDetailModalStyles";

interface EnergyDetailModalProps {
  visible: boolean;
  onClose: () => void;
  reading: ReadingData | null;
  theme: CardTheme;
  dateLabel: string;
  dayLabel: string;
}

interface OracleResult {
  loading: boolean;
  text: string;
  affirmation: string;
  action: string;
}

interface OracleColors {
  text: string;
  textMuted: string;
}
interface OracleContentOptions {
  loading: boolean;
  text: string;
  badges: React.ReactNode | null;
  loadingMessage: string;
  emptyIcon: string;
  emptyMessage: string;
  colors: OracleColors;
}
function renderOracleContent(opts: OracleContentOptions): React.ReactNode {
  const {
    loading,
    text,
    badges,
    loadingMessage,
    emptyIcon,
    emptyMessage,
    colors,
  } = opts;
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          {loadingMessage}
        </Text>
      </View>
    );
  }
  if (text) {
    return (
      <ScrollView
        style={styles.oracleTextScroll}
        showsVerticalScrollIndicator={false}
      >
        {badges}
        <Text style={[styles.oracleText, { color: colors.text }]}>{text}</Text>
      </ScrollView>
    );
  }
  return (
    <View style={styles.loadingBox}>
      <Text style={[styles.oracleEmptyIcon, { color: colors.textMuted }]}>
        {emptyIcon}
      </Text>
      <Text style={[styles.oracleEmptyText, { color: colors.textMuted }]}>
        {emptyMessage}
      </Text>
    </View>
  );
}
export function EnergyDetailModal({
  visible,
  onClose,
  reading,
  theme,
  dateLabel,
  dayLabel,
}: EnergyDetailModalProps) {
  const { colors, isDark } = useTheme();
  const slideScrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const profile = useMemo(() => getProfile(), []);
  const interests = useMemo(() => profile?.interests ?? [], [profile]);
  const birthDate = profile?.birthDate ?? "";
  const language = profile?.preferredLanguage ?? "en";
  const targetDate = dateLabel;
  // Total slides: 1 (general oracle) + N interests
  const totalSlides = 1 + interests.length;
  // Oracle states
  const [generalOracle, setGeneralOracle] = useState<OracleResult>({
    loading: false,
    text: "",
    affirmation: "",
    action: "",
  });
  const [interestOracles, setInterestOracles] = useState<
    Record<string, OracleResult>
  >({});
  // Reset state on mount
  useEffect(() => {
    setSlideIndex(0);
    slideScrollRef.current?.scrollTo({ x: 0, animated: false });
    setGeneralOracle({
      loading: false,
      text: "",
      affirmation: "",
      action: "",
    });
    setInterestOracles({});
  }, []);
  // Fetch general oracle on mount
  useEffect(() => {
    if (!birthDate || generalOracle.text || generalOracle.loading) return;

    setGeneralOracle((prev) => ({ ...prev, loading: true }));
    askOracle(
      `Give me a concise oracle insight for today based on my Balinese birth chart. Focus on the overall energy, mood, and guidance. Keep it under 150 words.`,
      birthDate,
      targetDate,
      language
    )
      .then((res) => {
        setGeneralOracle({
          loading: false,
          text: res.message || "",
          affirmation: "",
          action: "",
        });
      })
      .catch(() => {
        setGeneralOracle({
          loading: false,
          text: "Unable to load oracle insight. Please try again later.",
          affirmation: "",
          action: "",
        });
      });
  }, [
    birthDate,
    targetDate,
    language,
    generalOracle.text,
    generalOracle.loading,
  ]);
  // Fetch interest oracle when slide comes into view
  const fetchInterestOracle = useCallback(
    (interest: string) => {
      if (
        !birthDate ||
        interestOracles[interest]?.text ||
        interestOracles[interest]?.loading
      )
        return;

      setInterestOracles((prev) => ({
        ...prev,
        [interest]: { loading: true, text: "", affirmation: "", action: "" },
      }));

      const prompt = `What does my reading say about my ${interest} on ${targetDate}? Focus on practical advice.

Important: When mentioning the affirmation or action word, always wrap them in double quotes like "WORD".

At the end of your response, include these two lines:
AFFIRMATION: [a short powerful affirmation for ${interest}, max 5 words]
ACTION: [one specific action word or phrase for ${interest}, max 3 words]`;

      askOracle(prompt, birthDate, targetDate, language)
        .then((res) => {
          const insights = parseInsights(res.message, interest);
          setInterestOracles((prev) => ({
            ...prev,
            [interest]: {
              loading: false,
              text: insights.mainText,
              affirmation: insights.affirmation,
              action: insights.action,
            },
          }));
        })
        .catch(() => {
          const fallback = parseInsights(undefined, interest);
          setInterestOracles((prev) => ({
            ...prev,
            [interest]: {
              loading: false,
              text: "Unable to load insight. Please try again later.",
              affirmation: fallback.affirmation,
              action: fallback.action,
            },
          }));
        });
    },
    [birthDate, targetDate, language, interestOracles]
  );
  // Load interest oracle when a slide comes into view
  useEffect(() => {
    if (slideIndex > 0 && slideIndex <= interests.length) {
      const interest = interests[slideIndex - 1];
      fetchInterestOracle(interest);
    }
  }, [slideIndex, interests, fetchInterestOracle]);

  const handleSlideScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / SLIDE_SNAP);
      setSlideIndex(Math.max(0, Math.min(idx, totalSlides - 1)));
    },
    [totalSlides]
  );

  if (!reading) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: `${colors.surface}F2`,
              borderColor: `${colors.textMuted}40`,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                Close
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {theme.title}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Slide counter */}
          <View style={styles.slideCounter}>
            <Text
              style={[styles.slideCounterText, { color: colors.textMuted }]}
            >
              {slideIndex + 1} / {totalSlides}
              {slideIndex === 0
                ? " · Oracle Insight"
                : ` · ${INTEREST_LABELS[interests[slideIndex - 1]] ?? interests[slideIndex - 1]} Insight`}
            </Text>
          </View>

          {/* Horizontal card carousel */}
          <ScrollView
            ref={slideScrollRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            snapToInterval={SLIDE_SNAP}
            decelerationRate="fast"
            contentContainerStyle={styles.slideScroll}
            onMomentumScrollEnd={handleSlideScrollEnd}
            style={styles.slideContainer}
          >
            {/* Card 1: General Oracle */}
            <View
              style={[
                styles.slideCard,
                {
                  width: SLIDE_WIDTH,
                  backgroundColor: isDark
                    ? (colors.surfaceLight ?? colors.surface)
                    : "#FAFAFA",
                  borderColor: `${colors.textMuted}15`,
                },
              ]}
            >
              <View style={styles.oracleHeader}>
                <View
                  style={[
                    styles.oracleIconCircle,
                    { backgroundColor: `${theme.bg}20` },
                  ]}
                >
                  <Text style={styles.oracleIconEmoji}>🔮</Text>
                </View>
                <View style={styles.oracleHeaderText}>
                  <Text style={[styles.oracleTitle, { color: colors.text }]}>
                    Oracle Insight
                  </Text>
                  <Text
                    style={[styles.oracleDate, { color: colors.textMuted }]}
                  >
                    {dayLabel}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: `${colors.textMuted}15` },
                ]}
              />
              {renderOracleContent({
                loading: generalOracle.loading,
                text: generalOracle.text,
                badges: null,
                loadingMessage: "Consulting the oracle…",
                emptyIcon: "✨",
                emptyMessage: "Tap to receive your oracle insight",
                colors,
              })}
            </View>

            {/* Cards 2+: Per-interest oracles */}
            {interests.map((interest, i) => {
              const cfg = INTEREST_ICONS[interest] ?? {
                icon: "✨",
                bg: "#EDE9FE",
              };
              const label = INTEREST_LABELS[interest] ?? interest;
              const oracle = interestOracles[interest];
              const isLast = i === interests.length - 1;

              return (
                <View
                  key={interest}
                  style={[
                    styles.slideCard,
                    {
                      width: SLIDE_WIDTH,
                      marginRight: isLast ? 0 : SLIDE_GAP,
                      backgroundColor: isDark
                        ? (colors.surfaceLight ?? colors.surface)
                        : "#FAFAFA",
                      borderColor: `${colors.textMuted}15`,
                    },
                  ]}
                >
                  <View style={styles.oracleHeader}>
                    <View
                      style={[
                        styles.oracleIconCircle,
                        { backgroundColor: isDark ? `${cfg.bg}30` : cfg.bg },
                      ]}
                    >
                      <Text style={styles.oracleIconEmoji}>{cfg.icon}</Text>
                    </View>
                    <View style={styles.oracleHeaderText}>
                      <Text
                        style={[styles.oracleTitle, { color: colors.text }]}
                      >
                        {label} Insight
                      </Text>
                      <Text
                        style={[styles.oracleDate, { color: colors.textMuted }]}
                      >
                        {dayLabel}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: `${colors.textMuted}15` },
                    ]}
                  />

                  {renderOracleContent({
                    loading: !!oracle?.loading,
                    text: oracle?.text ?? "",
                    badges: oracle?.text ? (
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: isDark ? `${cfg.bg}30` : cfg.bg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: isDark ? "#E2E8F0" : "#334155" },
                            ]}
                          >
                            {oracle.affirmation}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: isDark
                                ? `${theme.bg}30`
                                : `${theme.bg}18`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: isDark ? "#E2E8F0" : "#334155" },
                            ]}
                          >
                            ⚡ {oracle?.action}
                          </Text>
                        </View>
                      </View>
                    ) : null,
                    loadingMessage: `Analyzing ${label.toLowerCase()}…`,
                    emptyIcon: cfg.icon,
                    emptyMessage: `Swipe here to load ${label.toLowerCase()} insight`,
                    colors,
                  })}
                </View>
              );
            })}
          </ScrollView>

          {/* Dot indicators */}
          <View style={styles.dots}>
            {Array.from({ length: totalSlides }, (_, i) => (
              <View
                key={i}
                style={[
                  i === slideIndex ? styles.dotActive : styles.dotInactive,
                  {
                    backgroundColor:
                      i === slideIndex ? colors.text : `${colors.textMuted}30`,
                  },
                ]}
              />
            ))}
          </View>

          {/* No interests hint */}
          {interests.length === 0 && (
            <Text style={[styles.noInterestsHint, { color: colors.textMuted }]}>
              Add interests in your Profile to see personalized insights
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
