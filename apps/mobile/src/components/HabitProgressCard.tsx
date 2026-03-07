import {
  Canvas,
  Path as SkiaPath,
  Skia,
  Circle as SkiaCircle,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { HabitCategory, HabitWithProgress } from "../types";

import { HABIT_ICONS } from "../types";

const RING_SIZE = 120;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CENTER = RING_SIZE / 2;

const COLOR_PRIMARY = "#7C3AED";
const COLOR_SUCCESS = "#22C55E";
const COLOR_WARNING = "#F59E0B";
const RING_BG_OPACITY = 0.12;
const DEGREES_IN_CIRCLE = 360;

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  health: "#22C55E",
  mindfulness: "#A78BFA",
  fitness: "#F97316",
  learning: "#0EA5E9",
  finance: "#EAB308",
  social: "#EC4899",
  creativity: "#F43F5E",
  spiritual: "#8B5CF6",
};

interface ThemeColors {
  text: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
}

interface HabitProgressCardProps {
  habits: HabitWithProgress[];
  colors: ThemeColors;
  isDark: boolean;
}

export function HabitProgressCard({
  habits,
  colors,
  isDark: _isDark,
}: HabitProgressCardProps) {
  const stats = useMemo(() => {
    const total = habits.length;
    const completed = habits.filter((h) => h.isCompletedToday).length;
    const rate = total > 0 ? completed / total : 0;
    const bestStreak = habits.reduce(
      (mx, h) => Math.max(mx, h.currentStreak),
      0
    );
    const totalTokens = habits.reduce(
      (sum, h) => (h.isCompletedToday ? sum + h.tokenReward : sum),
      0
    );

    // Category breakdown
    const catMap = new Map<HabitCategory, number>();
    for (const h of habits) {
      catMap.set(h.category, (catMap.get(h.category) ?? 0) + 1);
    }
    const categories = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, completed, rate, bestStreak, totalTokens, categories };
  }, [habits]);

  // Build donut arc path
  const arcPath = useMemo(() => {
    const path = Skia.Path.Make();
    if (stats.rate <= 0) return path;
    const angle = stats.rate * DEGREES_IN_CIRCLE;
    const startAngle = -90;
    path.addArc(
      {
        x: RING_STROKE / 2,
        y: RING_STROKE / 2,
        width: RING_SIZE - RING_STROKE,
        height: RING_SIZE - RING_STROKE,
      },
      startAngle,
      angle
    );
    return path;
  }, [stats.rate]);

  const ringColor = stats.rate >= 1 ? COLOR_SUCCESS : COLOR_PRIMARY;

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
      <Text style={[styles.title, { color: colors.text }]}>Habit Progress</Text>

      {/* Completion ring */}
      <View style={styles.ringRow}>
        <View style={styles.ringContainer}>
          <Canvas style={{ width: RING_SIZE, height: RING_SIZE }}>
            {/* Background ring */}
            <SkiaCircle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              style="stroke"
              strokeWidth={RING_STROKE}
              color={`${colors.textMuted}${Math.round(RING_BG_OPACITY * 255)
                .toString(16)
                .padStart(2, "0")}`}
            />
            {/* Progress arc */}
            <SkiaPath
              path={arcPath}
              style="stroke"
              strokeWidth={RING_STROKE}
              strokeCap="round"
              color={ringColor}
            />
          </Canvas>
          <View style={styles.ringLabel}>
            <Text style={[styles.ringPercent, { color: colors.text }]}>
              {Math.round(stats.rate * 100)}%
            </Text>
            <Text style={[styles.ringSubtext, { color: colors.textMuted }]}>
              done
            </Text>
          </View>
        </View>

        {/* Stats column */}
        <View style={styles.statsCol}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLOR_PRIMARY }]}>
              {stats.completed}/{stats.total}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Completed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLOR_WARNING }]}>
              🔥 {stats.bestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Best Streak
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLOR_SUCCESS }]}>
              +{stats.totalTokens}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              SKR Earned
            </Text>
          </View>
        </View>
      </View>

      {/* Category breakdown */}
      {stats.categories.length > 0 && (
        <View style={styles.catSection}>
          <Text style={[styles.catTitle, { color: colors.textSecondary }]}>
            By Category
          </Text>
          {stats.categories.map(([cat, count]) => {
            const barWidth = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <View key={cat} style={styles.catRow}>
                <Text style={styles.catEmoji}>{HABIT_ICONS[cat]}</Text>
                <Text
                  style={[styles.catLabel, { color: colors.textSecondary }]}
                >
                  {cat}
                </Text>
                <View
                  style={[
                    styles.catBarBg,
                    { backgroundColor: `${colors.textMuted}15` },
                  ]}
                >
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: CATEGORY_COLORS[cat],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.catCount, { color: colors.text }]}>
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {habits.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No habits yet — create one to track progress
        </Text>
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
  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabel: {
    position: "absolute",
    alignItems: "center",
  },
  ringPercent: { fontSize: 24, fontWeight: "800" },
  ringSubtext: { fontSize: 11, fontWeight: "500" },
  statsCol: {
    flex: 1,
    gap: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 12, fontWeight: "500" },
  catSection: { marginTop: 16 },
  catTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  catEmoji: { fontSize: 14 },
  catLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
    width: 80,
  },
  catBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  catBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  catCount: { fontSize: 12, fontWeight: "700", width: 20, textAlign: "right" },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 24 },
});
