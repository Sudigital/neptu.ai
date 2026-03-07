import { HABIT_REWARDS } from "@neptu/shared";
import { StyleSheet } from "react-native";

import type { HabitCategory, HabitFrequency } from "../types";

export interface ThemeColors {
  textMuted: string;
  primary: string;
  [key: string]: string;
}

export function getAiButtonBg(
  aiRemaining: number,
  aiLoading: boolean,
  colors: ThemeColors
): string {
  if (aiRemaining <= 0) return `${colors.textMuted}15`;
  if (aiLoading) return `${colors.primary}30`;
  return `${colors.primary}18`;
}

export const CATEGORIES: HabitCategory[] = [
  "health",
  "mindfulness",
  "fitness",
  "learning",
  "finance",
  "social",
  "creativity",
  "spiritual",
];

export const FREQUENCIES: { key: HabitFrequency; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "custom", label: "Custom" },
];

export const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
];

export const TOKEN_REWARDS = [
  HABIT_REWARDS.COMPLETION,
  HABIT_REWARDS.TOKEN_STEP,
  HABIT_REWARDS.TOKEN_HALF,
  HABIT_REWARDS.TOKEN_FULL,
];

export const VALID_FREQS: HabitFrequency[] = ["daily", "weekly", "custom"];

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 8,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10,
  },
  sheet: {
    borderRadius: 36,
    maxHeight: "90%",
    paddingBottom: 30,
    borderTopWidth: 8,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  cancelText: { fontSize: 15, fontWeight: "500" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  addText: { fontSize: 15, fontWeight: "700" },
  body: { paddingHorizontal: 20 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 60, textAlignVertical: "top" },
  titleInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleInput: { flex: 1 },
  aiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBtnInner: { alignItems: "center", justifyContent: "center" },
  aiBtnText: { fontSize: 18, lineHeight: 20 },
  aiBtnCount: { fontSize: 9, fontWeight: "700", lineHeight: 10, marginTop: -2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: { fontSize: 20, fontWeight: "600" },
  counterValue: {
    fontSize: 20,
    fontWeight: "800",
    minWidth: 30,
    textAlign: "center",
  },
  bottomSpacer: { height: 40 },
});
