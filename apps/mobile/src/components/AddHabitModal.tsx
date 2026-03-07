import { HABIT_LIMITS, HABIT_REWARDS } from "@neptu/shared";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

import type { NewHabitInput } from "../hooks/useHabits";
import type { HabitCategory, HabitFrequency } from "../types";

import { useTheme } from "../hooks/useTheme";
import { suggestHabitAI } from "../services/habit-api";
import {
  getAiSuggestsToday,
  getProfile,
  incrementAiSuggests,
} from "../services/storage";
import { HABIT_ICONS } from "../types";
import {
  CATEGORIES,
  FREQUENCIES,
  getAiButtonBg,
  styles,
  TIME_SLOTS,
  TOKEN_REWARDS,
  VALID_FREQS,
} from "./AddHabitModalStyles";

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (input: NewHabitInput) => void;
}

export function AddHabitModal({ visible, onClose, onAdd }: AddHabitModalProps) {
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HabitCategory>("health");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetCount, setTargetCount] = useState(1);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [tokenReward, setTokenReward] = useState(HABIT_REWARDS.COMPLETION);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsedCount, setAiUsedCount] = useState(() => getAiSuggestsToday());

  const aiRemaining = Math.max(
    0,
    HABIT_LIMITS.AI_SUGGEST_DAILY_FREE - aiUsedCount
  );

  const handleAISuggest = useCallback(async () => {
    if (aiRemaining <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Daily AI Limit Reached",
        `You've used all ${HABIT_LIMITS.AI_SUGGEST_DAILY_FREE} free AI suggestions today. Upgrade to Premium for ${HABIT_LIMITS.AI_SUGGEST_DAILY_PREMIUM}/day.`,
        [{ text: "OK" }]
      );
      return;
    }
    const profile = getProfile();
    if (!profile?.birthDate) return;
    setAiLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const suggestion = await suggestHabitAI(
        profile.birthDate,
        title.trim() || undefined,
        profile.preferredLanguage || "en"
      );
      if (suggestion.title) setTitle(suggestion.title);
      if (suggestion.description) setDescription(suggestion.description);
      if (
        suggestion.category &&
        CATEGORIES.includes(suggestion.category as HabitCategory)
      ) {
        setCategory(suggestion.category as HabitCategory);
      }
      if (
        suggestion.frequency &&
        VALID_FREQS.includes(suggestion.frequency as HabitFrequency)
      ) {
        setFrequency(suggestion.frequency as HabitFrequency);
      }
      if (
        suggestion.targetCount &&
        suggestion.targetCount >= 1 &&
        suggestion.targetCount <= 20
      ) {
        setTargetCount(suggestion.targetCount);
      }
      if (suggestion.scheduledTime) setScheduledTime(suggestion.scheduledTime);
      const newCount = incrementAiSuggests();
      setAiUsedCount(newCount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAiLoading(false);
    }
  }, [title, aiRemaining]);

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setCategory("health");
    setFrequency("daily");
    setTargetCount(1);
    setScheduledTime(null);
    setTokenReward(HABIT_REWARDS.COMPLETION);
  }, []);

  const handleAdd = useCallback(() => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd({
      title: title.trim(),
      description: description.trim(),
      category,
      frequency,
      targetCount,
      scheduledTime,
      daysOfWeek: frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : [],
      tokenReward,
    });
    reset();
    onClose();
  }, [
    title,
    description,
    category,
    frequency,
    targetCount,
    scheduledTime,
    tokenReward,
    onAdd,
    onClose,
    reset,
  ]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const inputBg = isDark ? colors.surfaceLight : "#F0F2F6";
  const inputBorder = isDark ? `${colors.primary}20` : "#D0D5DD";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
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
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              New Habit
            </Text>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!title.trim()}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.addText,
                  { color: title.trim() ? colors.primary : colors.textMuted },
                ]}
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Title
            </Text>
            <View style={styles.titleInputRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.titleInput,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: colors.text,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Morning Yoga"
                placeholderTextColor={colors.textMuted}
                maxLength={50}
              />
              <TouchableOpacity
                style={[
                  styles.aiBtn,
                  {
                    backgroundColor: getAiButtonBg(
                      aiRemaining,
                      aiLoading,
                      colors
                    ),
                    borderColor:
                      aiRemaining <= 0 ? colors.textMuted : colors.primary,
                  },
                ]}
                onPress={handleAISuggest}
                disabled={aiLoading}
                activeOpacity={0.7}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View style={styles.aiBtnInner}>
                    <Text
                      style={[
                        styles.aiBtnText,
                        {
                          color:
                            aiRemaining <= 0
                              ? colors.textMuted
                              : colors.primary,
                        },
                      ]}
                    >
                      ✨
                    </Text>
                    <Text
                      style={[
                        styles.aiBtnCount,
                        {
                          color:
                            aiRemaining <= 0
                              ? colors.textMuted
                              : colors.primary,
                        },
                      ]}
                    >
                      {aiRemaining}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Description (optional)
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
              Time (optional)
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

            {/* Token reward */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Token Reward
            </Text>
            <View style={styles.chipRow}>
              {TOKEN_REWARDS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.chip,
                    {
                      borderColor:
                        tokenReward === r ? colors.success : inputBorder,
                    },
                    tokenReward === r && {
                      backgroundColor: `${colors.success}18`,
                    },
                  ]}
                  onPress={() => setTokenReward(r)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          tokenReward === r
                            ? colors.success
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    +{r} SKR
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
