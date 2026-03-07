import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWithProgress,
} from "../types";

import { useTheme } from "../hooks/useTheme";
import { HABIT_ICONS } from "../types";
import {
  CATEGORIES,
  FREQUENCIES,
  TIME_SLOTS,
  styles,
} from "./HabitDetailModalStyles";

interface HabitDetailModalProps {
  visible: boolean;
  habit: HabitWithProgress | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Habit>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export function HabitDetailModal({
  visible,
  habit,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
}: HabitDetailModalProps) {
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HabitCategory>("health");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetCount, setTargetCount] = useState(1);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || "");
      setCategory(habit.category);
      setFrequency(habit.frequency);
      setTargetCount(habit.targetCount);
      setScheduledTime(habit.scheduledTime);
    }
  }, [habit]);

  const hasChanges =
    habit &&
    (title !== habit.title ||
      description !== (habit.description || "") ||
      category !== habit.category ||
      frequency !== habit.frequency ||
      targetCount !== habit.targetCount ||
      scheduledTime !== habit.scheduledTime);

  const handleSave = useCallback(() => {
    if (!habit || !title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate(habit.id, {
      title: title.trim(),
      description: description.trim(),
      category,
      frequency,
      targetCount,
      scheduledTime,
    });
    onClose();
  }, [
    habit,
    title,
    description,
    category,
    frequency,
    targetCount,
    scheduledTime,
    onUpdate,
    onClose,
  ]);

  const _handleArchive = useCallback(() => {
    if (!habit) return;
    Alert.alert(
      "Archive Habit",
      `Archive "${habit.title}"? You can restore it later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onUpdate(habit.id, { isArchived: true });
            onClose();
          },
        },
      ]
    );
  }, [habit, onUpdate, onClose]);

  const _handleDelete = useCallback(() => {
    if (!habit) return;
    Alert.alert(
      "Delete Habit",
      `Permanently delete "${habit.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(habit.id);
            onClose();
          },
        },
      ]
    );
  }, [habit, onDelete, onClose]);

  const handleComplete = useCallback(() => {
    if (!habit || habit.isCompletedToday) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onComplete(habit.id);
  }, [habit, onComplete]);

  if (!habit) return null;

  const progress =
    habit.targetCount > 0
      ? Math.min(habit.todayCount / habit.targetCount, 1)
      : 0;
  const inputBg = isDark ? colors.surfaceLight : "#F0F2F6";
  const inputBorder = isDark ? `${colors.primary}20` : "#D0D5DD";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
              Edit Habit
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || !title.trim()}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.saveText,
                  {
                    color:
                      hasChanges && title.trim()
                        ? colors.primary
                        : colors.textMuted,
                  },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Progress + Complete */}
            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: habit.isCompletedToday
                        ? colors.success
                        : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {habit.todayCount} / {habit.targetCount} completed
              </Text>
              <TouchableOpacity
                style={[
                  styles.completeBtn,
                  {
                    backgroundColor: habit.isCompletedToday
                      ? `${colors.success}18`
                      : colors.primary,
                    borderColor: habit.isCompletedToday
                      ? colors.success
                      : colors.primary,
                  },
                ]}
                onPress={handleComplete}
                disabled={habit.isCompletedToday}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.completeBtnText,
                    {
                      color: habit.isCompletedToday
                        ? colors.success
                        : "#FFFFFF",
                    },
                  ]}
                >
                  {habit.isCompletedToday ? "✓ Completed" : "Mark Complete"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                {
                  value: `${habit.todayCount}/${habit.targetCount}`,
                  label: "Today",
                  color: colors.primary,
                },
                {
                  value: `🔥 ${habit.currentStreak}`,
                  label: "Streak",
                  color: colors.warning,
                },
                {
                  value: `+${habit.tokenReward}`,
                  label: "SKR",
                  color: colors.success,
                },
              ].map(({ value, label, color }) => (
                <View
                  key={label}
                  style={[styles.statCard, { backgroundColor: `${color}12` }]}
                >
                  <Text style={[styles.statValue, { color }]}>{value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Title */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Title
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: colors.text,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Habit title"
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />

            {/* Description */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.inputMultiline,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: colors.text,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="What does this habit involve?"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={120}
            />

            {/* Category */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Category
            </Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      borderColor:
                        cat === category ? colors.primary : inputBorder,
                    },
                    cat === category && {
                      backgroundColor: `${colors.primary}18`,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          cat === category
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {HABIT_ICONS[cat]} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Frequency */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Frequency
            </Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.chip,
                    {
                      borderColor:
                        f.key === frequency ? colors.primary : inputBorder,
                    },
                    f.key === frequency && {
                      backgroundColor: `${colors.primary}18`,
                    },
                  ]}
                  onPress={() => setFrequency(f.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          f.key === frequency
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Target count */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Daily Target
            </Text>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={[styles.counterBtn, { borderColor: inputBorder }]}
                onPress={() => setTargetCount(Math.max(1, targetCount - 1))}
              >
                <Text style={[styles.counterBtnText, { color: colors.text }]}>
                  −
                </Text>
              </TouchableOpacity>
              <Text style={[styles.counterValue, { color: colors.text }]}>
                {targetCount}
              </Text>
              <TouchableOpacity
                style={[styles.counterBtn, { borderColor: inputBorder }]}
                onPress={() => setTargetCount(Math.min(20, targetCount + 1))}
              >
                <Text style={[styles.counterBtnText, { color: colors.text }]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scheduled time */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Time
            </Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    borderColor: !scheduledTime ? colors.primary : inputBorder,
                  },
                  !scheduledTime && { backgroundColor: `${colors.primary}18` },
                ]}
                onPress={() => setScheduledTime(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: !scheduledTime
                        ? colors.primary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  Anytime
                </Text>
              </TouchableOpacity>
              {TIME_SLOTS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    {
                      borderColor:
                        scheduledTime === t ? colors.primary : inputBorder,
                    },
                    scheduledTime === t && {
                      backgroundColor: `${colors.primary}18`,
                    },
                  ]}
                  onPress={() => setScheduledTime(t)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          scheduledTime === t
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
