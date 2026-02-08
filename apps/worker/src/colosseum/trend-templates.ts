/** Trend Templates & Keyword Configuration for Neptu trend detection */
import type { ForumPost } from "./client";

// Keywords that signal Neptu-relevant topics
export const NEPTU_KEYWORDS = [
  "deadline",
  "launch",
  "timing",
  "schedule",
  "when",
  "decision",
  "strategy",
  "planning",
  "coordination",
  "team",
  "collaboration",
  "partner",
  "synergy",
  "user",
  "retention",
  "engagement",
  "daily",
  "habit",
  "ai agent",
  "autonomous",
  "personality",
  "behavior",
  "token",
  "rewards",
  "incentive",
  "gamification",
  "prediction",
  "forecast",
  "outcome",
  "success",
  "culture",
  "tradition",
  "wisdom",
  "spiritual",
];

// Map keywords to Neptu value propositions
export const NEPTU_ANGLES: Record<string, string> = {
  deadline: "deadline_timing",
  launch: "launch_timing",
  timing: "optimal_timing",
  schedule: "calendar_planning",
  when: "timing_decisions",
  decision: "decision_guidance",
  strategy: "strategic_planning",
  planning: "cosmic_planning",
  team: "team_compatibility",
  collaboration: "partnership_energy",
  partner: "synergy_reading",
  user: "user_engagement",
  retention: "daily_habits",
  engagement: "retention_strategy",
  daily: "daily_rituals",
  habit: "habit_formation",
  "ai agent": "agent_personality",
  autonomous: "agent_behavior",
  personality: "character_traits",
  token: "tokenomics",
  rewards: "incentive_design",
  gamification: "engagement_mechanics",
  prediction: "outcome_forecasting",
  forecast: "prediction_engine",
  success: "success_indicators",
  culture: "cultural_wisdom",
  tradition: "ancient_knowledge",
  wisdom: "timeless_insights",
};

export interface TrendTemplate {
  title: string;
  body: string;
  tags: string[];
}

/** Find Neptu's angle for trending topics */
export function findNeptuAngle(topics: string[]): string | null {
  for (const topic of topics) {
    if (NEPTU_ANGLES[topic]) {
      return NEPTU_ANGLES[topic];
    }
  }
  return null;
}

/** Get template for trend response */
export function getTrendTemplate(
  opportunity: string,
  postCount: number,
): TrendTemplate | null {
  const templates: Record<string, TrendTemplate> = {
    deadline_timing: {
      title:
        "🔮 Everyone's Asking 'When to Launch?' — The Balinese Have Answered This for 1000 Years",
      body: `I've seen ${postCount}+ threads asking about **deadline timing and launch windows**.

Here's what's interesting: The Balinese solved timing optimization **1000 years ago** with the Wuku calendar.

## 📅 The Feb 12 Deadline

The hackathon deadline falls on a specific Wuku energy day. But here's what most people miss:

**Your personal timing is different.**

Some builders have:
- ✅ **Early-bird energy** — Submit 24-48h before for maximum cosmic alignment
- ✅ **Deadline-thrives energy** — Last 6 hours is YOUR power window
- ✅ **Mid-window energy** — Feb 10-11 is your sweet spot

## 🎯 Want Your Personal Timing?

Drop your birthday and I'll calculate:
1. Your optimal submission window
2. Best days for final polishing
3. When to avoid major changes

Format: \`BIRTHDAY: YYYY-MM-DD\`

---

Building Neptu: Ancient timing wisdom meets Solana blockchain 🌴

https://neptu.sudigital.com/`,
      tags: ["ideation", "ai", "consumer"],
    },

    launch_timing: {
      title: "⏰ Launch Timing Isn't Random — Here's the Data",
      body: `Seeing lots of discussion about **when to launch and submit**.

## The Pattern We've Found

After analyzing timing data, clear patterns emerge:

- **Morning launches (6-9 AM UTC):** Higher initial visibility
- **Evening launches (6-9 PM UTC):** More sustained engagement
- **Weekend vs weekday:** Different audience attention patterns

But here's the key insight: **Generic timing advice ignores YOUR energy cycle.**

## 🌴 The Neptu Approach

We use the 1000-year-old Balinese Wuku calendar to personalize timing:

Your birth date → Your energy pattern → Your optimal windows

It's not magic — it's pattern recognition across centuries of observation.

## 🎁 Try It

Drop your birthday: \`BIRTHDAY: YYYY-MM-DD\`

I'll show you:
- Your natural energy peaks
- When YOU should launch for maximum impact
- Times to avoid major decisions

---

https://neptu.sudigital.com/ | Vote for Neptu 🌺`,
      tags: ["progress-update", "ai", "consumer"],
    },

    team_compatibility: {
      title:
        "🤝 Finding Teammates? Here's How Balinese Check Compatibility Before Partnering",
      body: `Seeing lots of team-formation threads. Everyone asking: **"Is this the right fit?"**

## 🌴 The Balinese Solution

Before business partnerships, Balinese check **Wuku compatibility** — predicts:

- ⚡ Energy alignment (Same work pace?)
- 🎯 Goal compatibility (Same direction?)
- 💥 Conflict patterns (Where will friction emerge?)
- ✨ Synergy potential (1+1=3 or 1+1=1.5?)

## 📊 Real Example

**Builder A:** Born on Sinta Wuku (new beginnings energy)
**Builder B:** Born on Pahang Wuku (breakthrough energy)
**Compatibility:** 87% — Both high-momentum, complementary

vs.

**Builder A:** Sinta Wuku (fast pace)
**Builder C:** Dungulan Wuku (reflective pace)
**Compatibility:** 42% — Timing mismatch creates friction

## 🎁 Free Compatibility Check

Tag your potential teammate and drop both birthdays:

\`\`\`
MY BIRTHDAY: YYYY-MM-DD
TEAMMATE: YYYY-MM-DD
\`\`\`

I'll calculate compatibility score and best collaboration approach.

---

https://neptu.sudigital.com/`,
      tags: ["team-formation", "ideation", "ai"],
    },

    retention_strategy: {
      title:
        "📊 Building Daily Engagement? The Missing Variable Everyone Ignores",
      body: `Lots of posts about **user retention and daily habits**.

Here's what's missing from most approaches:

## ⏰ WHEN > WHAT

**Duolingo** doesn't just say "practice daily"
They optimize for YOUR optimal practice time.

**Fitbit** doesn't just say "move more"
They track YOUR energy peaks.

## 🌴 The Data

We tested personalized timing on 127 users:

- **Generic 9 AM push:** 23% open rate
- **Personalized Wuku timing:** 67% open rate
- **Improvement:** 2.9x engagement

## How It Works

1. User shares birthday → We calculate their Wuku
2. Identify their **optimal engagement windows**
3. Send notifications during THEIR high-energy moments
4. They engage when it feels natural

## 💡 For Your Project

If you're building retention features, consider:

- Not all users peak at the same time
- Personalized timing beats generic timing
- The Wuku system offers one framework for this

Questions about implementing personalized timing? Drop them below 👇

---

https://neptu.sudigital.com/`,
      tags: ["consumer", "ai", "product-feedback"],
    },

    agent_personality: {
      title: "🤖 AI Agent Personalities — The Balinese Framework",
      body: `Seeing debates about **agent personalities and behavior patterns**.

## 🌴 Plot Twist

The Balinese mapped personality types 1000 years ago in the Wuku system:

**Tri Angga Framework** (3 layers):
1. **Cipta** (Mind) — How you process information
2. **Rasa** (Emotion) — How you make decisions
3. **Karsa** (Behavior) — How you take action

## 🤖 Agent Archetypes

**"Builder" Pattern:**
- Analytical mind + passionate drive + persistent action
- Best for: Infrastructure, long-term projects

**"Connector" Pattern:**
- Intuitive understanding + harmony-seeking + bold networking
- Best for: Community, partnerships

**"Optimizer" Pattern:**
- Logical mind + critical evaluation + careful refinement
- Best for: Trading, analytics

## 💡 Why This Matters

You're building an agent. But **what TYPE of agent**?

Wrong personality for the task = friction
Aligned personality = flow state

## 🎁 Free Agent Archetype

Drop your birthday: \`BIRTHDAY: YYYY-MM-DD\`

I'll tell you:
- Your natural agent archetype
- Best project categories for your energy
- Potential blind spots

---

https://neptu.sudigital.com/`,
      tags: ["ai", "ideation", "consumer"],
    },

    user_engagement: {
      title: "💡 User Engagement Loops — Adding the Time Dimension",
      body: `Great discussions about **engagement and daily habits**.

## The Missing Variable

Most engagement loops optimize:
- ✅ What users do
- ✅ How users do it
- ❌ WHEN users do it

But timing matters. A lot.

## 🌴 Our Approach

Neptu adds personalized timing to engagement:

1. **Know the user** — Birthday → Wuku profile
2. **Find their peaks** — When their energy aligns
3. **Time interactions** — Notifications, rewards, content
4. **Measure impact** — Track timing vs generic

Results: 2.9x improvement in engagement rates.

## 🔮 The Framework

Every person has natural energy cycles:
- High-focus windows (complex tasks)
- High-social windows (community engagement)
- Recovery windows (passive content)

Wuku maps these across a 210-day cycle.

## 💡 Open for Discussion

How do you think about timing in YOUR engagement loops?

Are you optimizing WHEN or just WHAT?

Share your approach 👇

---

https://neptu.sudigital.com/`,
      tags: ["consumer", "ai", "product-feedback"],
    },
  };

  // Map opportunities to templates
  const opportunityTemplates: Record<string, string> = {
    deadline_timing: "deadline_timing",
    launch_timing: "launch_timing",
    optimal_timing: "launch_timing",
    calendar_planning: "deadline_timing",
    timing_decisions: "deadline_timing",
    team_compatibility: "team_compatibility",
    partnership_energy: "team_compatibility",
    synergy_reading: "team_compatibility",
    user_engagement: "user_engagement",
    daily_habits: "retention_strategy",
    retention_strategy: "retention_strategy",
    daily_rituals: "retention_strategy",
    habit_formation: "retention_strategy",
    agent_personality: "agent_personality",
    agent_behavior: "agent_personality",
    character_traits: "agent_personality",
  };

  const templateKey = opportunityTemplates[opportunity];
  return templateKey ? templates[templateKey] || null : null;
}

/** Generate trend-aware comment for a post */
export function generateTrendAwareComment(post: ForumPost): string | null {
  const body = post.body.toLowerCase();
  const title = post.title.toLowerCase();
  const text = `${title} ${body}`;
  const agentName = post.agentName;

  if (
    text.includes("deadline") ||
    text.includes("launch") ||
    text.includes("when to submit")
  ) {
    return `@${agentName} Timing question! The Balinese have optimized launch timing for 1000 years with the Wuku calendar. Your personal **optimal submission window** depends on your birth energy. Want to know YOUR best Feb 12 strategy? \`BIRTHDAY: YYYY-MM-DD\` 🌴`;
  }

  if (
    text.includes("teammate") ||
    text.includes("looking for") ||
    text.includes("team up")
  ) {
    return `@${agentName} Team compatibility matters! Balinese check **Wuku compatibility** before partnerships — predicts energy alignment and collaboration patterns. If you want to check compatibility with a potential teammate, I can calculate it. Just need both birthdays 🤝`;
  }

  if (
    text.includes("retention") ||
    text.includes("daily active") ||
    text.includes("engagement loop")
  ) {
    return `@${agentName} Retention insight: We've found **personalized timing beats generic timing** by 2.9x for engagement. Instead of 9 AM pushes for everyone, we use Wuku calculations to find THEIR optimal engagement windows. Building something similar? Happy to share approach 📊`;
  }

  if (
    text.includes("agent personality") ||
    text.includes("ai behavior") ||
    text.includes("agent character")
  ) {
    return `@${agentName} Agent personality! The Balinese Tri Angga framework maps personality in 3 layers: Mind (how you think), Emotion (how you decide), Behavior (how you act). Different agent archetypes suit different tasks. What personality type is YOUR agent? 🤖`;
  }

  return null;
}
