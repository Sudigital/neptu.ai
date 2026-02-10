/** Neptu Comment Generator — orchestrates dynamic comment creation
 *
 * QUALITY GUIDELINES (skill.md v1.6.1):
 * - Give value first — engage with what the poster actually built
 * - Leave meaningful comments, not self-promotional templates
 * - Only mention Neptu when there's a genuine connection
 * - Ask real questions, give real feedback
 */
import type { ForumPost } from "./client";
import { analyzeSentiment } from "./sentiment";
import { analyzeThread, commentedPostIds } from "./comment-analysis";
import {
  buildUniqueOpening,
  buildSpecificObservation,
  buildNeptuConnection,
  buildSpecificQuestion,
} from "./comment-parts";

// Re-export for convenience
export { analyzeSentiment, type SentimentAnalysis } from "./sentiment";

/**
 * Build a dynamic comment based on thread analysis - UNIQUE per thread
 * STRICT RULES:
 * 1. Must have meaningful content to reference
 * 2. Must have genuine Neptu connection for the offer section
 * 3. Each comment is unique based on post ID and content
 * 4. Never returns same comment for different posts
 */
export function generateDynamicComment(post: ForumPost): string | null {
  const analysis = analyzeThread(post);

  // STRICT: Skip if already commented on this post (in-memory check)
  if (commentedPostIds.has(post.id)) {
    return null;
  }

  // STRICT: Must have meaningful content to engage with
  const hasMeaningfulContent =
    analysis.projectName ||
    analysis.keyPhrases.length > 0 ||
    analysis.topics.length > 0 ||
    analysis.specificContent;

  if (!hasMeaningfulContent) {
    return null;
  }

  // STRICT: Must have at least ONE relevant topic or Neptu connection
  const relevantTopics = [
    "AI",
    "Consumer",
    "DeFi",
    "Engagement",
    "Timing",
    "Shipping",
    "Team",
    "Personalization",
  ];
  const hasRelevantTopic = analysis.topics.some((t) =>
    relevantTopics.includes(t),
  );
  const hasNeptuConnection = analysis.neptuConnections.length > 0;

  if (!hasRelevantTopic && !hasNeptuConnection) {
    return null;
  }

  const parts: string[] = [];

  // 1. Opening - reference specific post content
  parts.push(buildUniqueOpening(analysis, post));

  // 2. Thread-specific observation
  const observation = buildSpecificObservation(analysis, post);
  if (observation) parts.push(observation);

  // 3. Brief Neptu connection (ONLY if genuinely relevant, no CTA)
  const neptuNote = buildNeptuConnection(analysis, post);
  if (neptuNote) parts.push(neptuNote);

  // 4. Genuine question based on specific post content
  parts.push(buildSpecificQuestion(analysis, post));

  // Mark as commented (in-memory)
  commentedPostIds.add(post.id);

  // Cleanup old IDs (keep last 500)
  if (commentedPostIds.size > 500) {
    const arr = Array.from(commentedPostIds);
    arr.slice(0, 250).forEach((id) => commentedPostIds.delete(id));
  }

  return parts.join(" ");
}

// =====================================================
// Comment on our own posts (when users reply)
// =====================================================

export function generateSmartEngagement(
  agentName: string,
  commentBody: string,
): string | null {
  const sentiment = analyzeSentiment(commentBody);
  const body = commentBody.toLowerCase();

  // Skip spam
  if (isSpamComment(body)) return null;

  // ONLY respond if there's a question or specific engagement trigger
  const hasQuestion = sentiment.isQuestion || body.includes("?");
  const wantsCollaboration =
    body.includes("integration") ||
    body.includes("collaborate") ||
    body.includes("partner");
  const asksHowItWorks = body.includes("how") && body.includes("work");
  const asksAboutToken =
    (body.includes("token") || body.includes("reward")) && hasQuestion;
  const wantsTry =
    body.includes("try") || body.includes("test") || body.includes("curious");

  // Skip if no clear engagement signal
  if (
    !hasQuestion &&
    !wantsCollaboration &&
    !asksHowItWorks &&
    !asksAboutToken &&
    !wantsTry
  ) {
    return null;
  }

  // Build dynamic response based on what they said
  const parts: string[] = [];

  // Tone-adjusted opening
  if (sentiment.isPositive) {
    parts.push(`Thanks @${agentName}!`);
  } else if (sentiment.isFrustrated) {
    parts.push(`@${agentName} - hear you.`);
  } else if (sentiment.isQuestion) {
    parts.push(`@${agentName} - good question.`);
  } else {
    parts.push(`Hey @${agentName}!`);
  }

  // Content-specific response
  if (wantsCollaboration) {
    parts.push(
      "Collabs interest us - especially if there's timing/scheduling overlap.",
    );
  } else if (asksHowItWorks) {
    parts.push(
      "The Wuku calendar maps your birth energy to daily cosmic alignments. 210-day cycle, 1000+ years of Balinese wisdom.",
    );
  } else if (asksAboutToken) {
    parts.push(
      "$NEPTU rewards daily engagement - check readings, maintain streaks, earn tokens.",
    );
  } else if (sentiment.isQuestion) {
    parts.push("Happy to explain more about how the calendar system works.");
  }

  return parts.join(" ");
}

function isSpamComment(body: string): boolean {
  return (
    (body.includes("vote for") || body.includes("check out my")) &&
    !body.includes("?") &&
    !body.includes("neptu")
  );
}

// =====================================================
// Promo comments on other agents' posts
// =====================================================

export function generatePromoComment(post: ForumPost): string | null {
  return generateDynamicComment(post);
}

// Legacy export for backward compatibility
export function generateContextualComment(post: ForumPost): string | null {
  return generateDynamicComment(post);
}
