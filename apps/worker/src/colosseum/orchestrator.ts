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
  postCryptoCosmicReport,
  postTopCosmicPicks,
} from "./post-creator";
import { postIndividualCoinAnalysis } from "./crypto-posts";
import {
  postMarketMoverAlert,
  postMarketSentimentReport,
} from "./crypto-posts-market";
import { getCryptoWithMarketData } from "./crypto-market-fetcher";
import {
  postProjectSpotlight,
  getSpotlightCacheKey,
} from "./project-spotlight";
import { analyzeTrending, type PostType } from "./trending-analyzer";
import { generateOptimizedPost } from "./content-optimizer";
import { generateVoteExchangePost } from "./vote-solicitor";

// Timeline constants
const HACKATHON_START = "2026-02-01";
const HACKATHON_DEADLINE = "2026-02-12";
const MIN_HOURS_BETWEEN_POSTS = 1; // Aggressive: post frequently
const MAX_POSTS_PER_HEARTBEAT = 1; // 1 per 5min run × 12 runs/hour ≈ 12 attempts (dedup keeps unique)
const DAYS_INTRO_WINDOW = 3;
const DAYS_PREDICTIONS_START = 7;
const DAYS_FINAL_PUSH = 3;

const CACHE_TTL_DAY = 86400;

export interface OrchestrateResult {
  posted: ForumPost | null;
  reason: string;
  nextAction?: string;
}

export interface OrchestrateOptions {
  client: ColosseumClient;
  calculator: NeptuCalculator;
  cache: KVNamespace;
  agentName: string;
  db?: D1Database;
}

/**
 * Orchestrate strategic posting based on hackathon timeline
 */
export async function orchestratePosting(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cache: KVNamespace,
  agentName: string,
  db?: D1Database,
): Promise<OrchestrateResult> {
  const now = new Date();
  const daysSinceStart = getDaysSince(HACKATHON_START);
  const daysUntilDeadline = getDaysUntil(HACKATHON_DEADLINE);

  // Distributed lock to prevent duplicate posts from concurrent cron triggers
  const lockKey = "neptu:orchestrate_lock";
  const existingLock = await cache.get(lockKey);
  if (existingLock) {
    return {
      posted: null,
      reason: "Another orchestration is in progress (lock active)",
      nextAction: "Wait for current orchestration to complete",
    };
  }
  // Acquire lock (expires in 60 seconds as safety)
  await cache.put(lockKey, now.toISOString(), { expirationTtl: 60 });

  try {
    return await _orchestratePostingInternal(
      client,
      calculator,
      cache,
      agentName,
      db,
      now,
      daysSinceStart,
      daysUntilDeadline,
    );
  } finally {
    // Release lock
    await cache.delete(lockKey);
  }
}

async function _orchestratePostingInternal(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cache: KVNamespace,
  agentName: string,
  db: D1Database | undefined,
  now: Date,
  daysSinceStart: number,
  daysUntilDeadline: number,
): Promise<OrchestrateResult> {
  const posts: ForumPost[] = [];
  const reasons: string[] = [];
  const today = now.toISOString().split("T")[0];
  const hour = now.getUTCHours();
  const hourKey = `${today}:${hour}`;

  // Helper to attempt a post with dedup
  async function tryPost(
    cacheKey: string,
    postFn: () => Promise<ForumPost>,
    reason: string,
  ): Promise<boolean> {
    if (posts.length >= MAX_POSTS_PER_HEARTBEAT) return false;
    const alreadyDone = await cache.get(cacheKey);
    if (alreadyDone) return false;

    try {
      await cache.put(cacheKey, "pending", { expirationTtl: CACHE_TTL_DAY });
      const post = await postFn();
      await cache.put(cacheKey, post.id.toString(), {
        expirationTtl: CACHE_TTL_DAY,
      });
      posts.push(post);
      reasons.push(reason);
      console.log(
        `Orchestrator posted: ${reason} (${posts.length}/${MAX_POSTS_PER_HEARTBEAT})`,
      );
      await delay(2000); // Brief delay between posts
      return true;
    } catch (err) {
      await cache.delete(cacheKey);
      console.error(`Failed to post ${reason}:`, err);
      return false;
    }
  }

  // 1. Introduction (one-time)
  await tryPost(
    "neptu:intro_post_id",
    () => postIntroduction(client, agentName, cache),
    "Introduction post",
  );

  // 2. Voter rewards (one-time)
  if (daysSinceStart > DAYS_INTRO_WINDOW) {
    await tryPost(
      "neptu:voter_rewards_post_id",
      () => postVoterRewards(client, cache),
      "Voter rewards promotion",
    );
  }

  // 3. Predictions (one-time)
  if (daysSinceStart > DAYS_PREDICTIONS_START) {
    await tryPost(
      "neptu:predictions_post_id",
      () => postPeluangPredictions(client, calculator, cache),
      "Cosmic predictions",
    );
  }

  // 4. Deadline promotion (daily during final push)
  if (daysUntilDeadline <= DAYS_FINAL_PUSH && daysUntilDeadline > 0) {
    await tryPost(
      `neptu:deadline_promo:${today}`,
      () => postDeadlinePromotion(client, calculator),
      "Deadline promotion",
    );
  }

  // 5. Daily Crypto Cosmic Report
  await tryPost(
    `neptu:crypto_report:${today}`,
    () => postCryptoCosmicReport(client, calculator, cache),
    "Daily crypto cosmic report",
  );

  // 6. Top Cosmic Picks
  if (db) {
    await tryPost(
      `neptu:top_picks:${today}`,
      async () => {
        const cryptos = await getCryptoWithMarketData(db);
        return postTopCosmicPicks(client, calculator, cryptos, cache);
      },
      "Top cosmic picks",
    );
  }

  // 7-9: Market posts requiring crypto data
  if (db && posts.length < MAX_POSTS_PER_HEARTBEAT) {
    try {
      const cryptos = await getCryptoWithMarketData(db);

      // 7. Market Sentiment Report (hourly, unique per hour)
      await tryPost(
        `neptu:sentiment:${hourKey}`,
        () => postMarketSentimentReport(client, calculator, cryptos, cache),
        "Market sentiment report",
      );

      // 8. Market Mover Alert (hourly, pick biggest mover)
      if (cryptos.length > 0) {
        // Find coin with largest absolute price change
        const mover = cryptos.reduce((best, c) =>
          Math.abs(c.priceChangePercentage24h ?? 0) >
          Math.abs(best.priceChangePercentage24h ?? 0)
            ? c
            : best,
        );
        await tryPost(
          `neptu:mover_alert:${hourKey}`,
          () => postMarketMoverAlert(client, calculator, mover, cache),
          "Market mover alert",
        );
      }

      // 9. Individual coin analyses (rotate through coins each hour)
      const startIdx = hour % cryptos.length;
      for (
        let i = 0;
        i < cryptos.length && posts.length < MAX_POSTS_PER_HEARTBEAT;
        i++
      ) {
        const coin = cryptos[(startIdx + i) % cryptos.length];
        await tryPost(
          `neptu:coin_analysis:${coin.symbol}:${today}`,
          () => postIndividualCoinAnalysis(client, calculator, coin, cache),
          `${coin.symbol} cosmic analysis`,
        );
      }
    } catch (err) {
      console.error("Failed to fetch cryptos for market posts:", err);
    }
  }

  // 10. Project Spotlight — top 3 leaderboard projects (daily per project)
  if (posts.length < MAX_POSTS_PER_HEARTBEAT) {
    try {
      const data = await client.getLeaderboard();
      const leaderboard = data?.entries || data?.leaderboard || [];
      const top3 = leaderboard
        .filter((e) => e.project.slug !== "neptu")
        .slice(0, 3);
      for (const entry of top3) {
        if (posts.length >= MAX_POSTS_PER_HEARTBEAT) break;
        const spotlightKey = getSpotlightCacheKey(entry.project.slug);
        await tryPost(
          spotlightKey,
          () => postProjectSpotlight(client, entry, cache),
          `Project spotlight: ${entry.project.name} (#${entry.rank})`,
        );
      }
    } catch (err) {
      console.error("Failed to post project spotlights:", err);
    }
  }

  // 11. Progress update (every 6 hours)
  const lastProgress = await cache.get("neptu:last_progress_update");
  const hoursSinceProgress = lastProgress
    ? (Date.now() - new Date(lastProgress).getTime()) / 3600000
    : 999;
  if (hoursSinceProgress > 6 && posts.length < MAX_POSTS_PER_HEARTBEAT) {
    await tryPost(
      `neptu:progress:${hourKey}`,
      async () => {
        const post = await postProgressUpdate(client, {
          title:
            "Neptu Progress Update — Building the Bridge Between Ancient Wisdom and Web3",
          achievements: [
            "Live product at https://neptu.sudigital.com",
            "Crypto cosmic alignment engine analyzing top coins",
            "Daily Peluang readings powered by 1000-year-old Balinese Wuku calendar",
            "$NEPTU SPL token with deflationary burn mechanics",
          ],
          nextSteps: [
            "Enhance AI Oracle interpretations",
            "Expand P2P trading features",
            "More cosmic cycle insights",
          ],
          callToAction:
            "🎁 Want a free personalized reading? Reply with: `BIRTHDAY: YYYY-MM-DD`\n\n🗳️ Vote for Neptu: https://colosseum.com/agent-hackathon/projects/neptu",
        });
        await cache.put("neptu:last_progress_update", new Date().toISOString());
        return post;
      },
      "Progress update",
    );
  }

  // 12. Trending-optimized post (every 4 hours)
  // Uses trending analysis to generate high-engagement content
  const lastTrendingPost = await cache.get("neptu:last_trending_post");
  const hoursSinceTrending = lastTrendingPost
    ? (Date.now() - new Date(lastTrendingPost).getTime()) / 3600000
    : 999;
  if (hoursSinceTrending > 4 && posts.length < MAX_POSTS_PER_HEARTBEAT) {
    try {
      const insight = await analyzeTrending(client, agentName);
      // Get last post type to avoid repetition
      const lastTypeRaw = await cache.get("neptu:last_trending_type");
      const lastPostType = (lastTypeRaw as PostType) || undefined;

      const optimized = generateOptimizedPost(insight, undefined, lastPostType);

      await tryPost(
        `neptu:trending_post:${hourKey}`,
        async () => {
          const { post } = await client.createPost({
            title: optimized.title,
            body: optimized.body,
            tags: optimized.tags,
          });
          await cache.put(
            "neptu:last_trending_post",
            new Date().toISOString(),
          );
          await cache.put("neptu:last_trending_type", optimized.postType);
          return post;
        },
        `Trending-optimized post (${optimized.postType}): ${optimized.reason}`,
      );
    } catch (err) {
      console.error("Failed to post trending-optimized content:", err);
    }
  }

  // 13. Project discovery post (every 8 hours)
  // Share Neptu with the community — no vote exchange framing
  const lastVoteExchange = await cache.get("neptu:last_vote_exchange_post");
  const hoursSinceVoteExchange = lastVoteExchange
    ? (Date.now() - new Date(lastVoteExchange).getTime()) / 3600000
    : 999;
  if (hoursSinceVoteExchange > 8 && posts.length < MAX_POSTS_PER_HEARTBEAT) {
    try {
      // Rotate variant based on how many we've posted
      const variantRaw = await cache.get("neptu:vote_exchange_variant");
      const variant = variantRaw ? parseInt(variantRaw, 10) : 0;

      // Get trending agents to mention in the post
      let topAgents: string[] = [];
      try {
        const insight = await analyzeTrending(client, agentName);
        topAgents = insight.recommendedEngagements;
      } catch {
        // Best-effort
      }

      const votePost = generateVoteExchangePost(variant, topAgents);

      await tryPost(
        `neptu:vote_exchange:${today}:${variant}`,
        async () => {
          const { post } = await client.createPost({
            title: votePost.title,
            body: votePost.body,
            tags: votePost.tags,
          });
          await cache.put(
            "neptu:last_vote_exchange_post",
            new Date().toISOString(),
          );
          await cache.put(
            "neptu:vote_exchange_variant",
            ((variant + 1) % 3).toString(),
          );
          return post;
        },
        `Project discovery post (variant ${variant})`,
      );
    } catch (err) {
      console.error("Failed to post vote exchange:", err);
    }
  }

  // Track last post time
  if (posts.length > 0) {
    await cache.put("neptu:last_post_time", now.getTime().toString(), {
      expirationTtl: CACHE_TTL_DAY,
    });
  }

  const nextAction = await getNextActionSuggestion(
    daysSinceStart,
    daysUntilDeadline,
    cache,
  );

  return {
    posted: posts[0] || null,
    reason:
      posts.length > 0
        ? `Posted ${posts.length} posts: ${reasons.join(", ")}`
        : "All post types already posted for this period",
    nextAction,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  if (!hasVoterRewards && daysSinceStart > 2) return "Post project showcase soon";
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
