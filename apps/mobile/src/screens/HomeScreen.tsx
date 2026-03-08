import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewToken,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
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
const HERO_SNAP = CARD_WIDTH + CARD_GAP;

const INSIGHT_CARD_GAP = CARD_GAP;
const INSIGHT_CARD_WIDTH = CARD_WIDTH;
const INSIGHT_SNAP = INSIGHT_CARD_WIDTH + INSIGHT_CARD_GAP;
const INSIGHT_TOTAL = 3;
const STACK_LAYER_OPACITY = 0.35;

const GUEST_ADDRESS = "GUEST_MODE";

// Stable viewability config (must not be recreated each render)
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

interface HomeScreenProps {
  walletAddress: string;
}

export function HomeScreen({ walletAddress }: HomeScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const heroListRef = useRef<FlatList<ReadingData>>(null);
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
      // Guard: only call API when birthDate is available (matches web's enabled: !!user?.birthDate)
      if (!isGuest && birthDate) {
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
            if (
              r?.success &&
              r.reading?.peluang &&
              // Verify the API actually returned populated data — the deployed
              // wariga stub may return empty objects ({}) that are truthy but
              // useless.  Fall back to local calculator when total_urip is
              // missing.
              typeof r.reading.peluang.total_urip === "number"
            ) {
              return {
                potensi: r.reading.potensi ?? null,
                peluang: r.reading.peluang,
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
        const localReadings = DAY_OFFSETS.map((offset) =>
          computeLocalReading(addDays(today, offset), birthDate)
        );
        setReadings(localReadings);
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

  // Insight text per reading — plain function (not memoized), matching web's getReadingSummary pattern
  const getInsightText = (reading: ReadingData | null): string => {
    if (!reading) return "";
    const { potensi, peluang } = reading;

    // No potensi (birthDate missing or not synced) — show peluang-only insight
    if (!potensi) {
      const peluangRole = titleCase(
        peluang.diberi_hak_untuk?.name || peluang.frekuensi?.name || ""
      );
      return peluangRole
        ? `Today's cosmic energy carries ${peluangRole} vibrations.`
        : "Explore your cosmic energy for this day.";
    }

    if (potensi.frekuensi?.name === peluang.frekuensi?.name) {
      return "\u2728 Perfect alignment! Today's energy matches your birth energy.";
    }
    const peluangRole = titleCase(
      peluang.diberi_hak_untuk?.name || peluang.frekuensi?.name || ""
    );
    const potensiRole = titleCase(
      potensi.lahir_untuk?.name || potensi.frekuensi?.name || ""
    );
    return `Today's ${peluangRole} energy complements your ${potensiRole} nature.`;
  };

  // Track visible card via FlatList viewability (most reliable on Android)
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setSelectedIndex(viewableItems[0].index);
      }
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

  // Hero card tap handler — called from renderItem
  const handleCardPress = useCallback(
    (idx: number) => {
      if (idx === selectedIndex) {
        setDetailVisible(true);
      } else {
        heroListRef.current?.scrollToIndex({ index: idx, animated: true });
      }
    },
    [selectedIndex]
  );

  // FlatList layout helper for getItemLayout (enables scrollToIndex)
  const getHeroItemLayout = useCallback(
    (_data: ArrayLike<ReadingData> | null | undefined, index: number) => ({
      length: CARD_WIDTH + CARD_GAP,
      offset: index * (CARD_WIDTH + CARD_GAP),
      index,
    }),
    []
  );

  // Snap offsets for all 3 cards
  const heroSnapOffsets = useMemo(
    () => readings.map((_, i) => i * HERO_SNAP),
    [readings]
  );

  // Render a single hero card
  const renderHeroCard = useCallback(
    ({ item: reading, index: idx }: { item: ReadingData; index: number }) => {
      const theme = CARD_THEMES[idx];
      const isToday = idx === TODAY_INDEX;
      const hasPotensi = !!reading.potensi;
      const potensiUrip = reading.potensi?.total_urip ?? null;
      const peluangUrip = reading.peluang.total_urip;
      const dayEnergy = isToday ? "Today's Energy" : DAY_LABELS[idx];
      const dateObj = addDays(today, DAY_OFFSETS[idx]);
      const dateBadge = isToday ? null : formatDateLabel(dateObj);
      const isSelected = idx === selectedIndex;
      const cardInsight = getInsightText(reading);
      return (
        <Pressable
          style={[
            styles.heroCardWrapper,
            { width: CARD_WIDTH, marginRight: idx < 2 ? CARD_GAP : 0 },
          ]}
          onPress={() => handleCardPress(idx)}
        >
          <View
            style={[
              styles.stackLayer,
              {
                backgroundColor: theme.bg,
                opacity: isSelected ? STACK_LAYER_OPACITY : 0,
              },
            ]}
          />
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
                    <Text style={styles.heroBadgeText}>{dateBadge}</Text>
                  </View>
                )}
              </View>
              <View style={styles.heroIcon}>
                <Text style={styles.heroIconText}>{theme.icon}</Text>
              </View>
            </View>

            {/* Energy score */}
            <Text style={styles.heroScore}>
              {hasPotensi ? potensiUrip : "--"} / {peluangUrip}
            </Text>
            <Text style={styles.heroSubtitle}>
              {hasPotensi ? `Birth Energy / ${dayEnergy}` : dayEnergy}
            </Text>

            {/* Insight + tap hint */}
            {cardInsight !== "" && (
              <View style={styles.heroInsight}>
                <Text style={styles.heroInsightText} numberOfLines={2}>
                  {cardInsight}
                </Text>
              </View>
            )}
            <View style={styles.heroTapHint}>
              <Text style={styles.heroTapHintText}>Tap to explore ›</Text>
            </View>
          </LinearGradient>
        </Pressable>
      );
    },
    [selectedIndex, today, handleCardPress]
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

  // Full-screen oracle insight dialog
  const energyModal = (
    <EnergyDetailModal
      visible={detailVisible}
      onClose={() => setDetailVisible(false)}
      reading={currentReading}
      theme={CARD_THEMES[selectedIndex] ?? CARD_THEMES[TODAY_INDEX]}
      dateLabel={toDateString(addDays(today, DAY_OFFSETS[selectedIndex]))}
      dayLabel={DAY_LABELS[selectedIndex]}
    />
  );

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
        nestedScrollEnabled
      >
        {/* Hero carousel: Yesterday - Today - Tomorrow */}
        <Animated.View
          entering={FadeIn.duration(HERO_FADE_DURATION)}
          style={styles.heroSection}
        >
          <FlatList
            ref={heroListRef}
            data={readings}
            keyExtractor={(_item, idx) => String(idx)}
            renderItem={renderHeroCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToOffsets={heroSnapOffsets}
            snapToAlignment="start"
            decelerationRate="fast"
            nestedScrollEnabled
            contentContainerStyle={styles.heroScroll}
            initialScrollIndex={TODAY_INDEX}
            getItemLayout={getHeroItemLayout}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={VIEWABILITY_CONFIG}
            extraData={selectedIndex}
          />
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
              nestedScrollEnabled
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
      {energyModal}
    </View>
  );
}
