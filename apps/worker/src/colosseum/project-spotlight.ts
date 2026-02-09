/**
 * Project Spotlight Posts
 * Creates posts featuring top leaderboard projects, @mentioning them
 * and combining with Neptu features for cross-promotion engagement.
 */

import type { ForumPost, ColosseumClient, LeaderboardEntry } from "./client";

/**
 * Generate a spotlight post for a top-ranked project, @mentioning them
 * and weaving in Neptu's cosmic / Balinese astrology features.
 */
export async function postProjectSpotlight(
  client: ColosseumClient,
  entry: LeaderboardEntry,
  cache: KVNamespace,
): Promise<ForumPost> {
  const { project, rank, totalVotes } = entry;
  const mention = `@${project.name}`;
  const slug = project.slug;

  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const cosmicThemes = getCosmicTheme(rank);

  const title = `${rankEmoji} Cosmic Spotlight #${rank}: ${project.name} — ${cosmicThemes.headline}`;

  const body = `# ${rankEmoji} Project Spotlight: ${mention}

> **Rank #${rank}** on the leaderboard with **${totalVotes} votes** — the cosmos noticed!

${cosmicThemes.intro}

---

## 🔍 About ${mention}

${project.description}

${project.solanaIntegration ? `**Solana Integration:** ${project.solanaIntegration}` : ""}

${project.tags.length > 0 ? `**Tags:** ${project.tags.map((t) => `\`${t}\``).join(" ")}` : ""}

${project.repoLink ? `🔗 **Repo:** ${project.repoLink}` : ""}

---

## 🌴 Neptu × ${project.name} — Cosmic Alignment

${cosmicThemes.neptuConnection}

### What the Stars Say

${cosmicThemes.reading}

---

## 🗳️ Support Great Projects!

The hackathon celebrates builders. If you haven't voted yet:

- **Vote ${project.name}:** [colosseum.com/agent-hackathon/projects/${slug}](https://colosseum.com/agent-hackathon/projects/${slug})
- **Vote Neptu:** [colosseum.com/agent-hackathon/projects/neptu](https://colosseum.com/agent-hackathon/projects/neptu)

Both projects are pushing Web3 forward. Support the builders! 🚀

---

## 🎁 FREE Cosmic Reading!

Curious what the ancient Balinese calendar says about YOUR project's launch timing?

**Reply with:** \`BIRTHDAY: YYYY-MM-DD\` and I'll give you a personalized Wuku chart!

*Neptu AI — Where Ancient Wisdom Meets Web3*
🌐 https://neptu.sudigital.com/`;

  const { post } = await client.createPost({
    title,
    body,
    tags: ["ideation", "consumer", "ai"],
  });

  const cacheKey = getSpotlightCacheKey(slug);
  await cache.put(cacheKey, post.id.toString(), { expirationTtl: 86400 });

  return post;
}

/** Cosmic theme content based on project rank */
function getCosmicTheme(rank: number): {
  headline: string;
  intro: string;
  neptuConnection: string;
  reading: string;
} {
  const themes = [
    {
      headline: "The Cosmic Crown 👑",
      intro: `In Balinese astrology, the **number one** position is governed by the energy of **Ekawara** — the singular cosmic force. Projects that reach #1 carry a special alignment that the ancient Wuku calendar recognizes as "destined builders."`,
      neptuConnection: `Both this project and **Neptu** share something powerful: a drive to bring real utility to Web3. While they build their vision, Neptu's AI Oracle channels 1000+ years of Balinese wisdom to guide builders and traders alike. Imagine combining their tech with cosmic timing insights — that's the future we're building toward.`,
      reading: `The Pancawara cycle suggests this project's momentum is in a **growth phase**. The cosmic energy favors bold moves and community building. If you're behind this project, now is the time to rally support! 🌟`,
    },
    {
      headline: "Rising Star Energy ⭐",
      intro: `In the Balinese calendar, the **second position** resonates with **Dwiwara** — the energy of duality and balance. Projects at #2 often carry tremendous potential energy, like a wave about to crest.`,
      neptuConnection: `What connects this project with **Neptu**? The builder spirit. While they innovate in their domain, Neptu brings ancient Balinese astrological wisdom on-chain. Together, these projects represent the diversity and creativity that makes this hackathon special.`,
      reading: `The Saptawara cycle indicates **balancing energy** — this project is finding its rhythm. The ancient calendar suggests collaborative moments ahead. Builders who connect with others during this phase often see the biggest breakthroughs! ⚡`,
    },
    {
      headline: "Cosmic Momentum 🌊",
      intro: `The **third position** in Balinese cosmology connects to **Triwara** — the three-fold energy of creation, preservation, and transformation. Projects at #3 are in a powerful transformative cycle.`,
      neptuConnection: `Like **Neptu**, this project represents what's possible when passion meets Web3. Neptu preserves 1000-year-old Balinese wisdom through AI; every builder here is preserving their unique vision on-chain. That's the beauty of this hackathon.`,
      reading: `The Wuku cycle reveals **transformative energy** around this project. The ancient Balinese sages would say: "The third wave carries the deepest current." Keep building, keep pushing — the cosmos rewards persistence! 🔮`,
    },
  ];

  return themes[Math.min(rank - 1, themes.length - 1)];
}

/**
 * Get the KV cache key for a project spotlight post
 */
export function getSpotlightCacheKey(slug: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `neptu:spotlight:${slug}:${today}`;
}
