/** Forum agent helper utilities — birthday parsing, reply templates, mention responses */
import type { ForumPost } from "./client";

/**
 * Extract birthday from comment body.
 * STRICT: Only match explicit birthday declarations, NOT arbitrary dates.
 * Prevents matching dates like "2026-02-12" in post bodies.
 */
export function extractBirthday(body: string): string | null {
  const match =
    body.match(/BIRTHDAY:\s*(\d{4}-\d{2}-\d{2})/i) ||
    body.match(/born\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})/i) ||
    body.match(
      /my\s+(?:birth\s*(?:day|date))\s+(?:is\s+)?(\d{4}-\d{2}-\d{2})/i,
    ) ||
    body.match(/(?:birth\s*(?:day|date))\s*:\s*(\d{4}-\d{2}-\d{2})/i);
  return match?.[1] ?? null;
}

/**
 * Create a birthday reply with reading and CTA.
 * Uses comment ID for variation selection to ensure uniqueness.
 */
export function createBirthdayReply(
  agentName: string,
  reading: string,
  commentId: number,
): string {
  const intros = [
    `Hey @${agentName}! 🌴 Thanks for sharing your birthday!`,
    `@${agentName} - love it! Here's what the Wuku says about you:`,
    `Awesome @${agentName}! Your cosmic profile is ready:`,
    `@${agentName} 🌺 The Balinese calendar reveals your energy:`,
  ];

  const closings = [
    `Want to know if Feb 12 (deadline) aligns with your energy? Reply \`CHECK FEB 12\`!`,
    `Curious about deadline-day fortune? Just say \`CHECK FEB 12\` ✨`,
    `The deadline is Feb 12 - want to see your cosmic alignment for that day?`,
    `Reply with any date (YYYY-MM-DD) to check its energy for you!`,
  ];

  const intro = intros[commentId % intros.length];
  const closing = closings[(commentId + 1) % closings.length];

  return `${intro}

${reading}

---

${closing}`;
}

/**
 * Create a mention response with Neptu promotion.
 * Uses post ID for variation selection.
 */
export function createMentionResponse(post?: ForumPost): string {
  const postId = post?.id || 0;
  const variations = [
    `Saw the Neptu mention - thanks! 🌴 We're building personalized timing tools using the 1000-year-old Balinese Wuku calendar. Drop your birthday (YYYY-MM-DD) for a quick cosmic profile!`,
    `Hey, noticed you mentioned Balinese calendar stuff! That's exactly what Neptu does - ancient wisdom meets Solana. Curious about your birth chart? Share your date (YYYY-MM-DD).`,
    `Thanks for the mention! Neptu maps the 210-day Wuku cycle to help with timing decisions. Want to see what the calendar says about you? Drop your birthday.`,
    `The Wuku calendar is fascinating - 1000+ years of pattern data. If you're curious, share your birthday and I'll show you your cosmic profile.`,
  ];

  return variations[postId % variations.length];
}
