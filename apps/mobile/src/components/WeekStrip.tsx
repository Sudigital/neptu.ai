import { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "../hooks/useTheme";

interface WeekColors {
  primary: string;
  textMuted: string;
}

function getDayLabelColor(
  selected: boolean,
  today: boolean,
  colors: WeekColors
): string {
  if (selected) return "#FFFFFF";
  if (today) return colors.primary;
  return colors.textMuted;
}

interface WeekStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const VISIBLE_DAYS = 7;

function getNextDays(reference: Date): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the offset page — how many 7-day pages away from today
  const refTime = new Date(reference);
  refTime.setHours(0, 0, 0, 0);
  const diffMs = refTime.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  const pageOffset = Math.floor(diffDays / VISIBLE_DAYS);
  const startOffset = pageOffset * VISIBLE_DAYS;

  return Array.from({ length: VISIBLE_DAYS }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + startOffset + i);
    return date;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function WeekStrip({ selectedDate, onDateSelect }: WeekStripProps) {
  const { colors } = useTheme();

  const dates = useMemo(() => getNextDays(selectedDate), [selectedDate]);

  const shiftWeek = useCallback(
    (direction: number) => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + direction * VISIBLE_DAYS);
      onDateSelect(next);
    },
    [selectedDate, onDateSelect]
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.arrow}
        onPress={() => shiftWeek(-1)}
        activeOpacity={0.6}
      >
        <Text style={[styles.arrowText, { color: colors.textMuted }]}>‹</Text>
      </TouchableOpacity>

      {dates.map((date, i) => {
        const selected = isSameDay(date, selectedDate);
        const today = isToday(date);

        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.dayCell,
              selected && { backgroundColor: colors.primary },
              !selected &&
                today && { borderColor: colors.primary, borderWidth: 1.5 },
            ]}
            onPress={() => onDateSelect(date)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayLabel,
                { color: getDayLabelColor(selected, today, colors) },
              ]}
            >
              {SHORT_DAYS[date.getDay()]}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                { color: selected ? "#FFFFFF" : colors.text },
                selected && styles.dayNumberSelected,
              ]}
            >
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.arrow}
        onPress={() => shiftWeek(1)}
        activeOpacity={0.6}
      >
        <Text style={[styles.arrowText, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  arrow: {
    width: 28,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 24,
    fontWeight: "300",
  },
  dayCell: {
    width: 40,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  dayNumberSelected: {
    fontWeight: "800",
  },
});
