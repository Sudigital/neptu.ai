export const INTEREST_ICONS: Record<string, { icon: string; bg: string }> = {
  love: { icon: "💕", bg: "#FDE2E4" },
  career: { icon: "💼", bg: "#DBEAFE" },
  health: { icon: "🏃", bg: "#FFEDD5" },
  finance: { icon: "💰", bg: "#D1FAE5" },
  family: { icon: "👨‍👩‍👧‍👦", bg: "#FEF3C7" },
  friendship: { icon: "👋", bg: "#CCFBF1" },
  intimacy: { icon: "🔥", bg: "#FDE2E4" },
  spirituality: { icon: "🙏", bg: "#EDE9FE" },
  mindfulness: { icon: "🧘", bg: "#F3E8FF" },
  selfgrowth: { icon: "🌱", bg: "#ECFCCB" },
  purpose: { icon: "🧭", bg: "#F1F5F9" },
  balance: { icon: "☯️", bg: "#F5F5F4" },
  creativity: { icon: "🎨", bg: "#FCE7F3" },
  travel: { icon: "✈️", bg: "#CFFAFE" },
  fitness: { icon: "💪", bg: "#FEE2E2" },
  education: { icon: "📚", bg: "#E0E7FF" },
  luck: { icon: "🍀", bg: "#D1FAE5" },
  crypto: { icon: "🪙", bg: "#FEF9C3" },
};

export const INTEREST_LABELS: Record<string, string> = {
  love: "Love",
  career: "Career",
  health: "Health",
  finance: "Finance",
  family: "Family",
  friendship: "Friendship",
  intimacy: "Intimacy",
  spirituality: "Spirituality",
  mindfulness: "Mindfulness",
  selfgrowth: "Self Growth",
  purpose: "Purpose",
  balance: "Balance",
  creativity: "Creativity",
  travel: "Travel",
  fitness: "Fitness",
  education: "Education",
  luck: "Luck",
  crypto: "Crypto",
};

const INSIGHT_DEFAULTS: Record<
  string,
  { affirmation: string; action: string }
> = {
  love: { affirmation: "I AM LOVED", action: "Express gratitude" },
  career: { affirmation: "I AM SUCCESSFUL", action: "Network" },
  health: { affirmation: "I AM VITAL", action: "Move your body" },
  finance: { affirmation: "I AM ABUNDANT", action: "Invest wisely" },
  family: { affirmation: "I AM CONNECTED", action: "Reach out to family" },
  friendship: {
    affirmation: "I AM SUPPORTED",
    action: "Connect with a friend",
  },
  intimacy: { affirmation: "I AM PASSIONATE", action: "Be present and open" },
  spirituality: { affirmation: "I AM ALIGNED", action: "Meditate" },
  mindfulness: { affirmation: "I AM PRESENT", action: "Breathe deeply" },
  selfgrowth: { affirmation: "I AM EVOLVING", action: "Learn something new" },
  purpose: {
    affirmation: "I AM PURPOSEFUL",
    action: "Reflect on your mission",
  },
  balance: { affirmation: "I AM BALANCED", action: "Rest and recharge" },
  creativity: { affirmation: "I AM CREATIVE", action: "Create something" },
  travel: {
    affirmation: "I AM ADVENTUROUS",
    action: "Explore your surroundings",
  },
  fitness: { affirmation: "I AM STRONG", action: "Move your body" },
  education: { affirmation: "I AM WISE", action: "Read or study" },
  luck: { affirmation: "I AM FORTUNATE", action: "Trust your intuition" },
  crypto: { affirmation: "I AM PROSPEROUS", action: "Research the market" },
};

export function parseInsights(
  message: string | undefined,
  interest: string
): { affirmation: string; action: string; mainText: string } {
  const fallback = INSIGHT_DEFAULTS[interest] || {
    affirmation: "I AM FOCUSED",
    action: "Take action",
  };
  if (!message) return { ...fallback, mainText: "" };

  let affirmation = fallback.affirmation;
  let action = fallback.action;
  const contentLines: string[] = [];

  for (const line of message.split("\n")) {
    if (line.toUpperCase().includes("AFFIRMATION:")) {
      affirmation = line.replace(/AFFIRMATION:/i, "").trim();
    } else if (line.toUpperCase().includes("ACTION:")) {
      action = line.replace(/ACTION:/i, "").trim();
    } else {
      contentLines.push(line);
    }
  }

  return { affirmation, action, mainText: contentLines.join("\n").trim() };
}
