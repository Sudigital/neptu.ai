import { NeptuCalculator } from "@neptu/wariga";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { WukuDayGuidance, HabitCategory } from "../types";

import { useTheme } from "../hooks/useTheme";
import { HABIT_ICONS } from "../types";

const PANCA_FOCUS: Record<
  string,
  { focus: string; guidance: string; categories: HabitCategory[] }
> = {
  UMANIS: {
    focus: "Balance & harmony",
    guidance:
      "Inner peace flows today. Perfect for meditation and self-care habits.",
    categories: ["mindfulness", "health", "spiritual"],
  },
  PAHING: {
    focus: "Action & courage",
    guidance:
      "Bold energy surrounds you. Push through challenging fitness and career goals.",
    categories: ["fitness", "learning", "creativity"],
  },
  PON: {
    focus: "Prosperity & growth",
    guidance:
      "Abundance energy is strong. Focus on financial habits and skill-building.",
    categories: ["finance", "learning", "creativity"],
  },
  WAGE: {
    focus: "Wisdom & reflection",
    guidance:
      "Deep insight available today. Journal, learn, and nurture spiritual growth.",
    categories: ["learning", "spiritual", "mindfulness"],
  },
  KLIWON: {
    focus: "Connection & community",
    guidance:
      "Social energy peaks. Strengthen bonds and give back to your community.",
    categories: ["social", "health", "creativity"],
  },
};

const TINDAKAN_LABELS: Record<string, string> = {
  MINDFULNESS: "🧘 Mindfulness",
  WORSHIP: "🙏 Worship",
  PROBIOTIC: "🌿 Nourish body",
  SERVICE: "🤝 Serve others",
  "CLEAN UP": "🧹 Clean & organize",
  "DEEP SLEEP": "😴 Deep rest",
};

const RASA_LABELS: Record<string, string> = {
  PEACE: "☮️ Peaceful",
  APATHY: "😶 Neutral",
  ANGER: "🔥 Fiery",
  GRIEF: "💧 Reflective",
  PRIDE: "👑 Confident",
  PASSION: "❤️ Passionate",
  FEAR: "🌊 Cautious",
  FIRM: "🪨 Grounded",
  SINCERE: "💎 Sincere",
};

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// Map Wuku days to habit-relevant guidance
function getWukuGuidance(
  date: Date
): WukuDayGuidance & { tindakan: string; rasa: string } {
  const calc = new NeptuCalculator();
  const sapta = calc.getSaptaWara(date);
  const panca = calc.getPancaWara(date);
  const wuku = calc.getWuku(date);
  const c24Urip = calc.calculateC24Urip(date);
  const tindakan = calc.getTindakan(c24Urip);
  const rasa = calc.getRasa(c24Urip);

  const pancaName = panca?.name ?? "UMANIS";
  const mapped = PANCA_FOCUS[pancaName] ?? PANCA_FOCUS.UMANIS;

  return {
    wukuName: titleCase(wuku?.name ?? "Unknown"),
    saptaWara: titleCase(sapta?.name ?? "Unknown"),
    rpiasa: titleCase(pancaName),
    focusArea: mapped.focus,
    guidance: mapped.guidance,
    recommendedCategories: mapped.categories,
    tindakan: TINDAKAN_LABELS[tindakan.name] ?? tindakan.name,
    rasa: RASA_LABELS[rasa.name] ?? rasa.name,
  };
}

interface WukuGuidanceCardProps {
  date: Date;
  neptuEarned?: number;
}

export function WukuGuidanceCard({
  date,
  neptuEarned = 0,
}: WukuGuidanceCardProps) {
  const { colors, isDark } = useTheme();
  const guidance = useMemo(() => getWukuGuidance(date), [date]);

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(200)}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? `${colors.accent}10`
              : `${colors.accent}08`,
            borderColor: isDark ? `${colors.accent}25` : `${colors.accent}20`,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.icon]}>🔮</Text>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              Today&apos;s Cosmic Energy
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {guidance.wukuName} · {guidance.saptaWara} · {guidance.rpiasa}
            </Text>
          </View>
          {neptuEarned > 0 && (
            <View
              style={[
                styles.neptuBadge,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Text style={[styles.neptuBadgeText, { color: colors.primary }]}>
                ◆ {neptuEarned.toFixed(1)} NEPTU
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.focusLabel, { color: colors.accent }]}>
          ✦ {guidance.focusArea}
        </Text>

        <Text style={[styles.guidance, { color: colors.textSecondary }]}>
          {guidance.guidance}
        </Text>

        {/* Daily traits */}
        <View style={styles.traitsRow}>
          <View
            style={[
              styles.traitPill,
              {
                backgroundColor: `${colors.primary}12`,
                borderColor: `${colors.primary}25`,
              },
            ]}
          >
            <Text style={[styles.traitText, { color: colors.primary }]}>
              {guidance.tindakan}
            </Text>
          </View>
          <View
            style={[
              styles.traitPill,
              {
                backgroundColor: `${colors.accent}12`,
                borderColor: `${colors.accent}25`,
              },
            ]}
          >
            <Text style={[styles.traitText, { color: colors.accent }]}>
              {guidance.rasa}
            </Text>
          </View>
        </View>

        <View style={styles.categories}>
          {guidance.recommendedCategories.map((cat) => (
            <View
              key={cat}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: isDark
                    ? `${colors.primary}15`
                    : `${colors.primary}12`,
                  borderColor: isDark
                    ? `${colors.primary}30`
                    : `${colors.primary}20`,
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {HABIT_ICONS[cat]} {cat}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  neptuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  neptuBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  focusLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  guidance: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  traitsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  traitPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  traitText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
