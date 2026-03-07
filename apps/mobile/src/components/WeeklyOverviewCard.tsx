import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { HabitCompletion, HabitWithProgress } from "../types";

const COLOR_SUCCESS = "#22C55E";
const COLOR_PRIMARY = "#7C3AED";
const COLOR_WARNING = "#F59E0B";

const CELL_SIZE = 18;
const CELL_GAP = 3;
const CELL_RADIUS = 4;
const DAYS_BACK = 7;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCellBackground(
  isFuture: boolean,
  done: boolean,
  partial: boolean,
  colors: { textMuted: string }
): string {
  if (isFuture) return `${colors.textMuted}08`;
  if (done) return COLOR_SUCCESS;
  if (partial) return `${COLOR_WARNING}60`;
  return `${colors.textMuted}15`;
}

interface ThemeColors {
  text: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
}

interface WeeklyOverviewCardProps {
  habits: HabitWithProgress[];
  completions: HabitCompletion[];
  colors: ThemeColors;
  isDark: boolean;
  isPremium?: boolean;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Monday = 0 offset, Sunday = 6
  const mondayOffset = dayOfWeek === 0 ? -(DAYS_BACK - 1) : 1 - dayOfWeek;
  const dates: string[] = [];
  for (let i = 0; i < DAYS_BACK; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + mondayOffset + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function WeeklyOverviewCard({
  habits,
  completions,
  colors,
  isDark,
  isPremium = false,
}: WeeklyOverviewCardProps) {
  const weekDates = useMemo(() => getWeekDates(), []);
  const today = todayKey();

  // Build completion map: date -> habitId -> count
  const completionMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const c of completions) {
      if (!map.has(c.date)) map.set(c.date, new Map());
      map.get(c.date)!.set(c.habitId, c.count);
    }
    return map;
  }, [completions]);

  // Weekly stats
  const weekStats = useMemo(() => {
    let totalPossible = 0;
    let totalDone = 0;

    for (const date of weekDates) {
      for (const h of habits) {
        totalPossible++;
        const dayCompletions = completionMap.get(date);
        const count = dayCompletions?.get(h.id) ?? 0;
        if (count >= h.targetCount) totalDone++;
      }
    }

    const rate = totalPossible > 0 ? totalDone / totalPossible : 0;

    // Most consistent habit (most days completed this week)
    let bestHabit: HabitWithProgress | null = null;
    let bestDays = 0;
    for (const h of habits) {
      let days = 0;
      for (const date of weekDates) {
        const count = completionMap.get(date)?.get(h.id) ?? 0;
        if (count >= h.targetCount) days++;
      }
      if (days > bestDays) {
        bestDays = days;
        bestHabit = h;
      }
    }

    return { rate, totalDone, totalPossible, bestHabit, bestDays };
  }, [habits, weekDates, completionMap]);

  // Heatmap grid: habits × 7 days
  const visibleHabits = habits.slice(0, 6);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Weekly Overview
      </Text>

      {/* Weekly completion percentage */}
      <View style={[styles.weekRow, !isPremium && styles.blurredContent]}>
        <View style={styles.weekStatBlock}>
          <Text style={[styles.weekPercent, { color: COLOR_PRIMARY }]}>
            {Math.round(weekStats.rate * 100)}%
          </Text>
          <Text style={[styles.weekLabel, { color: colors.textMuted }]}>
            Weekly Rate
          </Text>
        </View>
        <View style={styles.weekStatBlock}>
          <Text style={[styles.weekPercent, { color: COLOR_SUCCESS }]}>
            {weekStats.totalDone}
          </Text>
          <Text style={[styles.weekLabel, { color: colors.textMuted }]}>
            Tasks Done
          </Text>
        </View>
        <View style={styles.weekStatBlock}>
          <Text style={[styles.weekPercent, { color: COLOR_WARNING }]}>
            {weekStats.totalPossible}
          </Text>
          <Text style={[styles.weekLabel, { color: colors.textMuted }]}>
            Total Tasks
          </Text>
        </View>
      </View>

      {/* Heatmap grid */}
      {visibleHabits.length > 0 && (
        <View style={[styles.heatSection, !isPremium && styles.blurredContent]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Activity
          </Text>

          {/* Day headers */}
          <View style={styles.heatRow}>
            <View style={styles.heatLabelCol} />
            {DAY_LABELS.map((d, i) => (
              <Text
                key={d}
                style={[
                  styles.heatDayLabel,
                  {
                    color:
                      weekDates[i] === today ? COLOR_PRIMARY : colors.textMuted,
                  },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Habit rows */}
          {visibleHabits.map((h) => (
            <View key={h.id} style={styles.heatRow}>
              <Text
                style={[styles.heatHabitLabel, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {h.title}
              </Text>
              {weekDates.map((date) => {
                const count = completionMap.get(date)?.get(h.id) ?? 0;
                const done = count >= h.targetCount;
                const partial = count > 0 && !done;
                const isFuture = date > today;
                const cellBg = getCellBackground(
                  isFuture,
                  done,
                  partial,
                  colors
                );
                return (
                  <View
                    key={date}
                    style={[styles.heatCell, { backgroundColor: cellBg }]}
                  >
                    {done && <Text style={styles.heatCheck}>✓</Text>}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* Most consistent habit */}
      {weekStats.bestHabit && weekStats.bestDays > 0 && (
        <View
          style={[
            styles.bestSection,
            { borderTopColor: `${colors.textMuted}15` },
            !isPremium && styles.blurredContent,
          ]}
        >
          <Text style={[styles.bestLabel, { color: colors.textMuted }]}>
            Most Consistent
          </Text>
          <Text
            style={[
              styles.bestHabit,
              { color: isDark ? "#A78BFA" : COLOR_PRIMARY },
            ]}
          >
            ⭐ {weekStats.bestHabit.title}
            <Text style={{ fontWeight: "500", color: colors.textSecondary }}>
              {" "}
              · {weekStats.bestDays}/7 days
            </Text>
          </Text>
        </View>
      )}

      {habits.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No habits yet — create one to see weekly stats
        </Text>
      )}

      {/* Premium lock overlay */}
      {!isPremium && (
        <View style={styles.lockOverlay}>
          <View
            style={[
              styles.lockBadge,
              {
                backgroundColor: isDark ? "#1E1B2E" : "#F5F3FF",
                borderColor: `${COLOR_PRIMARY}30`,
              },
            ]}
          >
            <Text style={styles.lockIcon}>🔒</Text>
            <Text
              style={[
                styles.lockTitle,
                { color: isDark ? "#A78BFA" : COLOR_PRIMARY },
              ]}
            >
              Premium
            </Text>
            <Text style={[styles.lockSubtitle, { color: colors.textMuted }]}>
              Upgrade to unlock weekly insights
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  weekRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  weekStatBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  weekPercent: { fontSize: 22, fontWeight: "800" },
  weekLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  heatSection: { marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  heatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: CELL_GAP,
  },
  heatLabelCol: { width: 70 },
  heatDayLabel: {
    width: CELL_SIZE,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: CELL_GAP / 2,
  },
  heatHabitLabel: {
    width: 70,
    fontSize: 10,
    fontWeight: "500",
  },
  heatCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_RADIUS,
    marginHorizontal: CELL_GAP / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  heatCheck: { fontSize: 9, color: "#FFF", fontWeight: "700" },
  bestSection: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  bestLabel: { fontSize: 11, fontWeight: "500", marginBottom: 4 },
  bestHabit: { fontSize: 13, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 24 },
  blurredContent: { opacity: 0.15 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  lockIcon: { fontSize: 28, marginBottom: 8 },
  lockTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  lockSubtitle: { fontSize: 12, fontWeight: "500", textAlign: "center" },
});
