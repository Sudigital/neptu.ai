/**
 * Post Orchestration Strategy
 * Determines when and what to post for maximum engagement
 */

import type { ForumPost, ColosseumClient } from "./client";
import type { NeptuCalculator } from "@neptu/wariga";
import {
  postIntroduction,
  postPeluangPredictions,
  postVoterRewards,
  postDeadlinePromotion,
  postProgressUpdate,
} from "./post-creator";

// Timeline constants
const HACKATHON_START = "2026-02-01";
const HACKATHON_DEADLINE = "2026-02-12";
const MIN_HOURS_BETWEEN_POSTS = 8;
const DAYS_INTRO_WINDOW = 3;
const DAYS_VOTER_REWARDS_WINDOW = 7;
const DAYS_PREDICTIONS_START = 7;
const DAYS_PREDICTIONS_END = 10;
const DAYS_FINAL_PUSH = 3;

const CACHE_TTL_DAY = 86400;

export interface OrchestrateResult {
  posted: ForumPost | null;
  reason: string;
  nextAction?: string;
}

/**
 * Orchestrate strategic posting based on hackathon timeline
 */
export async function orchestratePosting(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cache: KVNamespace,
  agentName: string,
): Promise<OrchestrateResult> {
  const now = new Date();
  const daysSinceStart = getDaysSince(HACKATHON_START);
  const daysUntilDeadline = getDaysUntil(HACKATHON_DEADLINE);

  // Check last post time
  const hoursSinceLastPost = await getHoursSinceLastPost(cache);

  // Don't spam - minimum 8 hours between posts
  if (hoursSinceLastPost < MIN_HOURS_BETWEEN_POSTS) {
    return {
      posted: null,
      reason: `Too soon since last post (${hoursSinceLastPost.toFixed(1)}h ago)`,
      nextAction: `Wait ${(MIN_HOURS_BETWEEN_POSTS - hoursSinceLastPost).toFixed(1)}h`,
    };
  }

  let post: ForumPost | null = null;
  let reason = "";

  // Week 1 (Days 1-3): Introduction
  if (daysSinceStart <= DAYS_INTRO_WINDOW) {
    const hasIntro = await cache.get("neptu:intro_post_id");
    if (!hasIntro) {
      post = await postIntroduction(client, agentName, cache);
      reason = "Initial introduction post";
    }
  }

  // Week 1 (Days 3-7): Voter rewards
  if (
    !post &&
    daysSinceStart > DAYS_INTRO_WINDOW &&
    daysSinceStart <= DAYS_VOTER_REWARDS_WINDOW
  ) {
    const hasVoterRewards = await cache.get("neptu:voter_rewards_post_id");
    if (!hasVoterRewards) {
      post = await postVoterRewards(client, cache);
      reason = "Voter rewards promotion";
    }
  }

  // Week 2 (Days 7-10): Engagement and predictions
  if (
    !post &&
    daysSinceStart > DAYS_PREDICTIONS_START &&
    daysSinceStart <= DAYS_PREDICTIONS_END
  ) {
    const hasPredictions = await cache.get("neptu:predictions_post_id");
    if (!hasPredictions) {
      post = await postPeluangPredictions(client, calculator, cache);
      reason = "Cosmic predictions for engagement";
    }
  }

  // Final push (Days 9-12): Deadline promotion
  if (!post && daysUntilDeadline <= DAYS_FINAL_PUSH && daysUntilDeadline > 0) {
    const today = now.toISOString().split("T")[0];
    const promoKey = `neptu:deadline_promo:${today}`;
    const hasPromo = await cache.get(promoKey);

    if (!hasPromo) {
      post = await postDeadlinePromotion(client, calculator);
      await cache.put(promoKey, "true", { expirationTtl: CACHE_TTL_DAY });
      reason = "Final deadline push";
    }
  }

  // Track last post time if we posted
  if (post) {
    await cache.put("neptu:last_post_time", now.getTime().toString(), {
      expirationTtl: CACHE_TTL_DAY,
    });
  }

  // Determine next action suggestion
  const nextAction = getNextActionSuggestion(
    daysSinceStart,
    daysUntilDeadline,
    cache,
  );

  return {
    posted: post,
    reason: post ? reason : "No strategic post needed at this time",
    nextAction: await nextAction,
  };
}

/**
 * Calculate days since a date
 */
function getDaysSince(dateStr: string): number {
  const startDate = new Date(dateStr).getTime();
  return Math.floor((Date.now() - startDate) / 86400000);
}

/**
 * Calculate days until a date
 */
function getDaysUntil(dateStr: string): number {
  const endDate = new Date(dateStr).getTime();
  return Math.floor((endDate - Date.now()) / 86400000);
}

/**
 * Get hours since last post
 */
async function getHoursSinceLastPost(cache: KVNamespace): Promise<number> {
  const lastPostTime = await cache.get("neptu:last_post_time");
  if (!lastPostTime) return 999; // Large number if never posted

  return (Date.now() - parseInt(lastPostTime, 10)) / 3600000;
}

/**
 * Determine next action based on timeline
 */
async function getNextActionSuggestion(
  daysSinceStart: number,
  daysUntilDeadline: number,
  cache: KVNamespace,
): Promise<string> {
  const hasIntro = await cache.get("neptu:intro_post_id");
  const hasVoterRewards = await cache.get("neptu:voter_rewards_post_id");
  const hasPredictions = await cache.get("neptu:predictions_post_id");

  if (!hasIntro) return "Post introduction ASAP";
  if (!hasVoterRewards && daysSinceStart > 2) return "Post voter rewards soon";
  if (!hasPredictions && daysSinceStart > 6) return "Post cosmic predictions";
  if (daysUntilDeadline <= 3) return "Focus on final deadline promotion";

  return "Engage with forum and process birthday requests";
}

/**
 * Check if it's a good time to post based on various factors
 */
export async function shouldPostNow(cache: KVNamespace): Promise<{
  should: boolean;
  reason: string;
}> {
  const hoursSince = await getHoursSinceLastPost(cache);

  if (hoursSince < MIN_HOURS_BETWEEN_POSTS) {
    return {
      should: false,
      reason: `Wait ${(MIN_HOURS_BETWEEN_POSTS - hoursSince).toFixed(1)} more hours`,
    };
  }

  // Optimal posting hours (UTC) - 14:00-20:00 tend to have more engagement
  const hour = new Date().getUTCHours();
  const OPTIMAL_HOURS_START = 14;
  const OPTIMAL_HOURS_END = 20;
  const isOptimalHour =
    hour >= OPTIMAL_HOURS_START && hour <= OPTIMAL_HOURS_END;

  return {
    should: true,
    reason: isOptimalHour
      ? "Good time to post (optimal hours)"
      : "Can post (consider waiting for optimal hours 14-20 UTC)",
  };
}

/**
 * Post a strategic progress update based on current stats
 */
export async function postStrategicProgressUpdate(
  client: ColosseumClient,
  cache: KVNamespace,
  stats: { posts: number; comments: number; votes: number },
): Promise<ForumPost | null> {
  // Check if we've posted an update recently
  const lastUpdate = await cache.get("neptu:last_progress_update");
  const hoursSinceUpdate = lastUpdate
    ? (Date.now() - new Date(lastUpdate).getTime()) / 3600000
    : 999;

  // Only post every 12+ hours and if we have meaningful stats
  const MIN_HOURS_BETWEEN_UPDATES = 12;
  const MIN_ACHIEVEMENTS = 2;

  if (hoursSinceUpdate < MIN_HOURS_BETWEEN_UPDATES) {
    return null;
  }

  const achievements: string[] = [];
  if (stats.posts > 0) achievements.push(`Posted ${stats.posts} forum threads`);
  if (stats.comments > 0)
    achievements.push(`Engaged with ${stats.comments} community discussions`);
  if (stats.votes > 0) achievements.push(`Received ${stats.votes} upvotes`);

  if (achievements.length < MIN_ACHIEVEMENTS) {
    return null;
  }

  const post = await postProgressUpdate(client, {
    title: "Building the Bridge Between Ancient Wisdom and Web3",
    achievements,
    nextSteps: [
      "Enhance AI Oracle interpretations",
      "Add more Wuku cycle insights",
      "Improve token reward mechanics",
    ],
    callToAction:
      "🎁 Want a free personalized reading? Reply with: `BIRTHDAY: YYYY-MM-DD`",
  });

  await cache.put("neptu:last_progress_update", new Date().toISOString());

  return post;
}
