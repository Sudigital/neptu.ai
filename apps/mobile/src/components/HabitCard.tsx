import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import type { HabitWithProgress } from "../types";

import { useTheme } from "../hooks/useTheme";
import { HABIT_ICONS } from "../types";

interface ThemeColors {
  success: string;
  surface: string;
  primary: string;
}

function getCardBackground(
  isCompleted: boolean,
  isDark: boolean,
  colors: ThemeColors
): string {
  if (isCompleted) {
    return isDark ? `${colors.success}12` : `${colors.success}18`;
  }
  return colors.surface;
}

function getCardBorder(
  isCompleted: boolean,
  isDark: boolean,
  colors: ThemeColors
): string {
  if (isCompleted) {
    return `${colors.success}40`;
  }
  return isDark ? `${colors.primary}15` : "#E0E5ED";
}

interface HabitCardProps {
  habit: HabitWithProgress;
  index: number;
  onComplete: (habitId: string) => void;
  onPress: (habit: HabitWithProgress) => void;
}

export function HabitCard({
  habit,
  index,
  onComplete,
  onPress,
}: HabitCardProps) {
  const { colors, isDark } = useTheme();

  const progress =
    habit.targetCount > 0
      ? Math.min(habit.todayCount / habit.targetCount, 1)
      : 0;
  const icon = HABIT_ICONS[habit.category];

  const handleComplete = useCallback(() => {
    if (habit.isCompletedToday) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete(habit.id);
  }, [habit.id, habit.isCompletedToday, onComplete]);

  const handlePress = useCallback(() => {
    onPress(habit);
  }, [habit, onPress]);

  const cardBg = getCardBackground(habit.isCompletedToday, isDark, colors);
  const borderCol = getCardBorder(habit.isCompletedToday, isDark, colors);

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(400)}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: borderCol },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.leftSection}>
          {/* Completion circle */}
          <TouchableOpacity
            style={[
              styles.checkCircle,
              habit.isCompletedToday && {
                backgroundColor: colors.success,
                borderColor: colors.success,
              },
              !habit.isCompletedToday && {
                borderColor: `${colors.textMuted}60`,
              },
            ]}
            onPress={handleComplete}
            activeOpacity={0.6}
          >
            {habit.isCompletedToday && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {icon} {habit.title}
            </Text>
            {habit.scheduledTime && (
              <Text style={[styles.time, { color: colors.textMuted }]}>
                {habit.scheduledTime}
              </Text>
            )}
          </View>

          {habit.description ? (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {habit.description}
            </Text>
          ) : null}

          <View style={styles.bottomRow}>
            {/* Progress indicator */}
            {habit.targetCount > 1 && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.surfaceLight },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.progressText, { color: colors.textMuted }]}
                >
                  {habit.todayCount}/{habit.targetCount}
                </Text>
              </View>
            )}

            {/* Streak badge */}
            {habit.currentStreak > 0 && (
              <View
                style={[
                  styles.streakBadge,
                  {
                    backgroundColor: `${colors.warning}18`,
                    borderColor: `${colors.warning}40`,
                  },
                ]}
              >
                <Text style={[styles.streakText, { color: colors.warning }]}>
                  🔥 {habit.currentStreak}d
                </Text>
              </View>
            )}

            {/* Token reward */}
            {habit.tokenReward > 0 && (
              <Text style={[styles.rewardText, { color: colors.success }]}>
                +{habit.tokenReward} SKR
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  leftSection: {
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    maxWidth: 80,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
  },
  streakBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rewardText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
