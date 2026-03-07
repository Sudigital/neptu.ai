import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { HabitWithProgress } from "../types";

import { AddHabitModal } from "../components/AddHabitModal";
import { ErrorBanner } from "../components/ErrorBanner";
import { HabitCard } from "../components/HabitCard";
import { HabitDetailModal } from "../components/HabitDetailModal";
import { WeekStrip } from "../components/WeekStrip";
import { WukuGuidanceCard } from "../components/WukuGuidanceCard";
import { useHabits } from "../hooks/useHabits";
import { useTheme } from "../hooks/useTheme";
import { fetchHabitRewards } from "../services/habit-api";
import { getProfile } from "../services/storage";
import { dailyCheckIn } from "../services/voice-api";

interface HabitScreenProps {
  walletAddress: string;
}

const AFTERNOON_HOUR = 18;
const FADE_DURATION = 600;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < AFTERNOON_HOUR) return "Good afternoon";
  return "Good evening";
}

export function HabitScreen({ walletAddress }: HabitScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    refreshHabits,
  } = useHabits();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitWithProgress | null>(
    null
  );
  const [neptuEarned, setNeptuEarned] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const prevCompletedRef = useRef(0);

  // Profile display name
  const profile = getProfile();
  const displayName = profile?.displayName ?? "Seeker";

  // Auto daily check-in
  const checkedInRef = useRef(false);
  useEffect(() => {
    if (!checkedInRef.current) {
      checkedInRef.current = true;
      dailyCheckIn(walletAddress).catch(() => {
        /* already checked in or offline — ignore silently */
      });
      fetchHabitRewards()
        .then((r) => setNeptuEarned(r.totalEarned))
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Failed to load rewards";
          setApiError(msg);
        });
    }
  }, [walletAddress]);

  const handleHabitPress = useCallback((habit: HabitWithProgress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedHabit(habit);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshHabits();
    setRefreshing(false);
  }, [refreshHabits]);

  // Streak celebration when all habits completed
  useEffect(() => {
    if (
      totalCount > 0 &&
      completedCount === totalCount &&
      prevCompletedRef.current < totalCount
    ) {
      setCelebration("🎉 All done! Amazing streak!");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => setCelebration(null), 3000);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount, totalCount]);

  // Sort habits: scheduled first (by time), then anytime, completed last
  const sortedHabits = [...habits].sort((a, b) => {
    if (a.isCompletedToday !== b.isCompletedToday)
      return a.isCompletedToday ? 1 : -1;
    if (a.scheduledTime && !b.scheduledTime) return -1;
    if (!a.scheduledTime && b.scheduledTime) return 1;
    if (a.scheduledTime && b.scheduledTime)
      return a.scheduledTime.localeCompare(b.scheduledTime);
    return 0;
  });

  const completedCount = habits.filter((h) => h.isCompletedToday).length;
  const totalCount = habits.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

      {/* Celebration toast */}
      {celebration && (
        <Animated.View
          entering={ZoomIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={styles.celebrationToast}
        >
          <Text style={styles.celebrationText}>{celebration}</Text>
        </Animated.View>
      )}

      {/* Sticky header + week strip */}
      <View
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <Animated.View
          entering={FadeIn.duration(FADE_DURATION)}
          style={styles.headerSection}
        >
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.screenTitle, { color: colors.text }]}>
                Habits
              </Text>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {getGreeting()}, {displayName}
              </Text>
            </View>
            <View style={styles.titleRight}>
              {!isSameDay(selectedDate, new Date()) && (
                <TouchableOpacity
                  style={[
                    styles.todayBadge,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSelectedDate(new Date())}
                  activeOpacity={0.8}
                >
                  <Text style={styles.todayBadgeText}>Today</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        <WeekStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Wuku guidance card */}
        <WukuGuidanceCard date={selectedDate} neptuEarned={neptuEarned} />

        {/* Progress summary */}
        {totalCount > 0 && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            style={styles.progressRow}
          >
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: colors.surfaceLight },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressLabel, { color: colors.textSecondary }]}
            >
              {completedCount}/{totalCount} done
            </Text>
          </Animated.View>
        )}

        {/* Habit list */}
        <View style={styles.habitList}>
          {sortedHabits.length === 0 ? (
            <Animated.View
              entering={FadeIn.delay(400).duration(FADE_DURATION)}
              style={styles.emptyState}
            >
              <Text style={[styles.emptyIcon]}>🌱</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Start your journey
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Tap the + button to create your first habit
              </Text>
            </Animated.View>
          ) : (
            sortedHabits.map((habit, i) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                index={i}
                onComplete={completeHabit}
                onPress={handleHabitPress}
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB — Add habit */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: 130 }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modals */}
      <AddHabitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addHabit}
      />
      <HabitDetailModal
        visible={selectedHabit !== null}
        habit={selectedHabit}
        onClose={() => setSelectedHabit(null)}
        onUpdate={updateHabit}
        onDelete={deleteHabit}
        onComplete={(id: string) => {
          completeHabit(id);
          setSelectedHabit(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: { zIndex: 10 },
  scroll: { flex: 1 },
  headerSection: { paddingHorizontal: 20, marginBottom: 0 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRight: { alignItems: "flex-end", gap: 4 },
  screenTitle: { fontSize: 24, fontWeight: "900", letterSpacing: 0.3 },
  todayBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  todayBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  dateText: { fontSize: 13, fontWeight: "500", marginTop: -1 },
  neptuBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  neptuBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: "600" },
  habitList: { paddingHorizontal: 16, paddingTop: 4 },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  bottomSpacer: { height: 100 },

  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 30,
  },
  celebrationToast: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    zIndex: 50,
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  celebrationText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
