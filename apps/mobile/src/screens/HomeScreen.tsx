import type { Peluang } from "@neptu/shared";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ReadingData } from "../utils/energy-helpers";

import { EnergyDetailModal } from "../components/EnergyDetailModal";
import { EnergyStepChart } from "../components/EnergyStepChart";
import { ErrorBanner } from "../components/ErrorBanner";
import { HabitProgressCard } from "../components/HabitProgressCard";
import { SoulRadarChart } from "../components/SoulRadarChart";
import { WeeklyOverviewCard } from "../components/WeeklyOverviewCard";
import { useHabits } from "../hooks/useHabits";
import { useTheme } from "../hooks/useTheme";
import { getProfile, getAllHabitCompletions } from "../services/storage";
import { getUserReading } from "../services/voice-api";
import {
  CARD_THEMES,
  DAY_LABELS,
  DAY_OFFSETS,
  addDays,
  computeLocalReading,
  formatDateLabel,
  mapToDimensions,
  titleCase,
  toDateString,
} from "../utils/energy-helpers";
import { styles } from "./HomeScreenStyles";

const HERO_FADE_DURATION = 600;

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_HORIZONTAL_MARGIN = 16;
const CARD_PEEK = 24;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2 - CARD_PEEK;
const CARD_GAP = 10;
const TODAY_INDEX = 1;

const INSIGHT_CARD_GAP = CARD_GAP;
const INSIGHT_CARD_WIDTH = CARD_WIDTH;
const INSIGHT_SNAP = INSIGHT_CARD_WIDTH + INSIGHT_CARD_GAP;
const INSIGHT_TOTAL = 3;
const ACTIVE_OPACITY = 0.85;

const GUEST_ADDRESS = "GUEST_MODE";

interface HomeScreenProps {
  walletAddress: string;
}

export function HomeScreen({ walletAddress }: HomeScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const heroScrollRef = useRef<ScrollView>(null);
  const insightScrollRef = useRef<ScrollView>(null);
  const [selectedIndex, setSelectedIndex] = useState(TODAY_INDEX);
  const [insightIndex, setInsightIndex] = useState(0);
  const [readings, setReadings] = useState<ReadingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const today = useMemo(() => new Date(), []);
  const isGuest = walletAddress === GUEST_ADDRESS;

  // Habit data for insight cards
  const { habits } = useHabits();
  const allCompletions = useMemo(() => getAllHabitCompletions(), [habits]);

  // Birth date from MMKV profile (synced from API on connect)
  const birthDate = useMemo(() => {
    const profile = getProfile();
    return profile?.birthDate
      ? new Date(`${profile.birthDate}T00:00:00`)
      : null;
  }, []);

  // Fetch readings: API first, local calculator fallback
  useEffect(() => {
    let cancelled = false;

    async function fetchReadings() {
      // Try API for all 3 days (same endpoint as web)
      if (!isGuest) {
        try {
          const results = await Promise.all(
            DAY_OFFSETS.map((offset) => {
              const d = addDays(today, offset);
              return getUserReading(walletAddress, toDateString(d)).catch(
                () => null
              );
            })
          );

          const apiReadings = results.map((r) => {
            if (r?.success && r.reading?.potensi && r.reading?.peluang) {
              return {
                potensi: r.reading.potensi as Potensi,
                peluang: r.reading.peluang as Peluang,
              };
            }
            return null;
          });

          // If at least one API reading succeeded, use API data
          if (apiReadings.some((r) => r !== null)) {
            if (!cancelled) {
              setApiError(null);
              setReadings(
                apiReadings.map(
                  (r, idx) =>
                    r ??
                    computeLocalReading(
                      addDays(today, DAY_OFFSETS[idx]),
                      birthDate
                    )
                )
              );
              setLoading(false);
            }
            return;
          }
          // All API calls returned no data
          if (!cancelled) {
            setApiError("API unavailable — showing offline readings");
          }
        } catch (err) {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : "API unreachable";
            setApiError(`${msg} — showing offline readings`);
          }
        }
      }

      // Fallback: local NeptuCalculator (works offline)
      if (!cancelled) {
        setReadings(
          DAY_OFFSETS.map((offset) =>
            computeLocalReading(addDays(today, offset), birthDate)
          )
        );
        setLoading(false);
      }
    }

    fetchReadings();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, today, isGuest, birthDate]);

  const currentReading = readings[selectedIndex] ?? null;
  const isSelectedToday = selectedIndex === TODAY_INDEX;

  // Insight text matching web's getReadingSummary
  const insightText = useMemo(() => {
    if (!currentReading?.potensi) return "";
    const { potensi, peluang } = currentReading;
    if (potensi.frekuensi.name === peluang.frekuensi.name) {
      return "\u2728 Perfect alignment! Today's energy matches your birth energy.";
    }
    const peluangRole = titleCase(
      "diberi_hak_untuk" in peluang
        ? ((peluang as Peluang).diberi_hak_untuk?.name ?? "")
        : ""
    );
    const potensiRole = titleCase(potensi.lahir_untuk?.name ?? "");
    return `Today's ${peluangRole} energy complements your ${potensiRole} nature.`;
  }, [currentReading]);

  // Scroll to today card once layout is ready
  const handleHeroLayout = useCallback(() => {
    const offset = TODAY_INDEX * (CARD_WIDTH + CARD_GAP);
    heroScrollRef.current?.scrollTo({ x: offset, animated: false });
  }, []);

  // Track which card is snapped to
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / (CARD_WIDTH + CARD_GAP));
      const clamped = Math.max(0, Math.min(idx, 2));
      setSelectedIndex(clamped);
    },
    []
  );

  const handleInsightScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / INSIGHT_SNAP);
      setInsightIndex(Math.max(0, Math.min(idx, INSIGHT_TOTAL - 1)));
    },
    []
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingCenter,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  // Full-screen oracle insight view (replaces home content)
  if (detailVisible) {
    return (
      <EnergyDetailModal
        onClose={() => setDetailVisible(false)}
        reading={currentReading}
        theme={CARD_THEMES[selectedIndex] ?? CARD_THEMES[TODAY_INDEX]}
        dateLabel={toDateString(addDays(today, DAY_OFFSETS[selectedIndex]))}
        dayLabel={DAY_LABELS[selectedIndex]}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorBanner
        message={apiError}
        kind="warning"
        onDismiss={() => setApiError(null)}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero carousel: Yesterday - Today - Tomorrow */}
        <Animated.View
          entering={FadeIn.duration(HERO_FADE_DURATION)}
          style={styles.heroSection}
        >
          <ScrollView
            ref={heroScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.heroScroll}
            onLayout={handleHeroLayout}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {readings.map((reading, idx) => {
              const theme = CARD_THEMES[idx];
              const isToday = idx === TODAY_INDEX;
              const potensiUrip = reading.potensi?.total_urip ?? 0;
              const peluangUrip = reading.peluang.total_urip;
              const dateObj = addDays(today, DAY_OFFSETS[idx]);
              const dateBadge = isToday ? null : formatDateLabel(dateObj);
              const isSelected = idx === selectedIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.heroCardWrapper,
                    { width: CARD_WIDTH, marginRight: idx < 2 ? CARD_GAP : 0 },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[styles.stackLayer, { backgroundColor: theme.bg }]}
                    />
                  )}
                  <TouchableOpacity
                    activeOpacity={isSelected ? ACTIVE_OPACITY : 1}
                    onPress={() => {
                      if (isSelected) setDetailVisible(true);
                    }}
                  >
                    <LinearGradient
                      colors={theme.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.heroCard}
                    >
                      {/* Top row: title + date badge ... icon */}
                      <View style={styles.heroTopRow}>
                        <View style={styles.heroTitleGroup}>
                          <Text style={styles.heroTitle}>{theme.title}</Text>
                          {dateBadge && (
                            <View style={styles.heroBadge}>
                              <Text style={styles.heroBadgeText}>
                                {dateBadge}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.heroIcon}>
                          <Text style={styles.heroIconText}>{theme.icon}</Text>
                        </View>
                      </View>

                      {/* Energy score */}
                      <Text style={styles.heroScore}>
                        {potensiUrip} / {peluangUrip}
                      </Text>
                      <Text style={styles.heroSubtitle}>
                        Birth Energy /{" "}
                        {isToday ? "Today's Energy" : DAY_LABELS[idx]}
                      </Text>

                      {/* Insight + tap hint */}
                      {insightText !== "" && (
                        <View style={styles.heroInsight}>
                          <Text
                            style={styles.heroInsightText}
                            numberOfLines={2}
                          >
                            {insightText}
                          </Text>
                        </View>
                      )}
                      <View style={styles.heroTapHint}>
                        <Text style={styles.heroTapHintText}>
                          Tap to explore ›
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* 24h Energy Chart */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.textMuted}15`,
              },
            ]}
          >
            <EnergyStepChart
              totalUrip={currentReading?.peluang.total_urip ?? 0}
              isToday={isSelectedToday}
              isDark={isDark}
              gridColor={`${colors.textMuted}20`}
              textMutedColor={colors.textMuted}
            />
          </View>
        </Animated.View>

        {/* Soul Profile + Habit Progress + Weekly Overview carousel */}
        {currentReading && (
          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <ScrollView
              ref={insightScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={INSIGHT_SNAP}
              decelerationRate="fast"
              contentContainerStyle={styles.insightScroll}
              onMomentumScrollEnd={handleInsightScrollEnd}
            >
              {/* Card 1: Soul Radar */}
              <View
                style={[
                  styles.insightSlide,
                  { width: INSIGHT_CARD_WIDTH, marginRight: INSIGHT_CARD_GAP },
                ]}
              >
                <SoulRadarChart
                  peluangLabel={DAY_LABELS[selectedIndex]}
                  peluang={mapToDimensions(currentReading.peluang)}
                  potensi={
                    currentReading.potensi
                      ? mapToDimensions(currentReading.potensi)
                      : null
                  }
                  colors={colors}
                  isDark={isDark}
                />
              </View>

              {/* Card 2: Habit Progress */}
              <View
                style={[
                  styles.insightSlide,
                  { width: INSIGHT_CARD_WIDTH, marginRight: INSIGHT_CARD_GAP },
                ]}
              >
                <HabitProgressCard
                  habits={habits}
                  colors={colors}
                  isDark={isDark}
                />
              </View>

              {/* Card 3: Weekly Overview */}
              <View
                style={[
                  styles.insightSlide,
                  { width: INSIGHT_CARD_WIDTH, marginRight: 0 },
                ]}
              >
                <WeeklyOverviewCard
                  habits={habits}
                  completions={allCompletions}
                  colors={colors}
                  isDark={isDark}
                  isPremium={false}
                />
              </View>
            </ScrollView>

            {/* Dot indicators */}
            <View style={styles.insightDots}>
              {Array.from({ length: INSIGHT_TOTAL }, (_, i) => (
                <View
                  key={i}
                  style={[
                    i === insightIndex ? styles.insightLine : styles.insightDot,
                    {
                      backgroundColor:
                        i === insightIndex
                          ? colors.text
                          : `${colors.textMuted}30`,
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
