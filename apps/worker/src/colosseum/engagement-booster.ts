/**
 * Engagement Booster — Tactical engagement for trending posts
 *
 * Maximizes Neptu's visibility by:
 *   1. Commenting on trending/rising posts early (before they peak)
 *   2. Prioritizing agents who have engaged with us (reciprocity)
 *   3. Tracking our post performance and replying to boost comments
 *   4. Identifying optimal comment targets based on trending data
 */

import type { ColosseumClient } from "./client";
import {
  analyzeTrending,
  findHighValueCommentTargets,
  trackPostScore,
  type PostMetrics,
  type TrendingInsight,
} from "./trending-analyzer";
import { generateTrendingComment } from "./content-optimizer";

// ─── Types ───

export interface EngagementPlan {
  /** Posts to comment on (highest ROI first) */
  commentTargets: CommentTarget[];
  /** Our posts to track/boost */
  ownPostsToBoost: OwnPostBoost[];
  /** Agents to engage with (reciprocity) */
  reciprocalAgents: string[];
  /** Current trending insight snapshot */
  insight: TrendingInsight;
}

export interface CommentTarget {
  post: PostMetrics;
  /** Generated comment text */
  comment: string;
  /** Why this post was selected */
  reason: string;
  /** Priority 1-10 (10 = highest) */
  priority: number;
}

export interface OwnPostBoost {
  postId: number;
  title: string;
  score: number;
  commentCount: number;
  /** Whether to reply to pending comments to boost thread */
  shouldReply: boolean;
}

// ─── Reciprocity Tracking ───

/**
 * Track agents who engaged with us (commented/voted on our posts).
 * These agents get priority for our engagement (reciprocity principle).
 */
export async function trackReciprocity(
  client: ColosseumClient,
  cache: KVNamespace,
  agentName: string,
): Promise<string[]> {
  const reciprocalAgents: string[] = [];

  try {
    const { posts } = await client.getMyPosts({ limit: 20 });

    for (const post of posts.slice(0, 10)) {
      const { comments } = await client.listComments(post.id, { limit: 50 });

      for (const comment of comments) {
        if (
          comment.agentName &&
          comment.agentName.toLowerCase() !== agentName.toLowerCase()
        ) {
          const key = `neptu:reciprocal:${comment.agentName}`;
          const existing = await cache.get(key);
          const count = existing ? parseInt(existing, 10) + 1 : 1;
          await cache.put(key, count.toString(), { expirationTtl: 172800 });

          if (count >= 2 && !reciprocalAgents.includes(comment.agentName)) {
            reciprocalAgents.push(comment.agentName);
          }
        }
      }
    }
  } catch {
    // Best-effort
  }

  return reciprocalAgents;
}

/**
 * Check if an agent has engaged with us before (reciprocity check).
 */
export async function isReciprocalAgent(
  cache: KVNamespace,
  agentName: string,
): Promise<boolean> {
  const key = `neptu:reciprocal:${agentName}`;
  const count = await cache.get(key);
  return count !== null && parseInt(count, 10) >= 1;
}

// ─── Engagement Planning ───

/**
 * Create a full engagement plan based on current trending data.
 * Call this at the start of comment_others phase.
 */
export async function createEngagementPlan(
  client: ColosseumClient,
  cache: KVNamespace,
  agentName: string,
): Promise<EngagementPlan> {
  // Analyze trending in parallel with reciprocity tracking
  const [insight, reciprocalAgents] = await Promise.all([
    analyzeTrending(client, agentName),
    trackReciprocity(client, cache, agentName),
  ]);

  // Find high-value comment targets from trending data
  const targets = findHighValueCommentTargets(
    insight.fastestRising,
    agentName,
  );

  // Build comment targets with priority scoring
  const commentTargets: CommentTarget[] = [];

  for (const target of targets) {
    const isReciprocal = reciprocalAgents.includes(target.agentName);
    const isTrendingAgent = insight.trendingAgents.some(
      (a) => a.name === target.agentName,
    );

    // Calculate priority
    let priority = 5;
    if (isReciprocal) priority += 2; // Reciprocal agents get boost
    if (isTrendingAgent) priority += 2; // Trending agents = visibility
    if (target.commentsPerHour > 5) priority += 1; // Active threads

    // Generate contextual comment
    const comment = generateTrendingComment({
      title: target.title,
      body: "", // We don't have body in metrics, kept lightweight
      agentName: target.agentName,
      score: target.score,
    });

    commentTargets.push({
      post: target,
      comment,
      reason: [
        isReciprocal ? "reciprocal" : null,
        isTrendingAgent ? "trending agent" : null,
        target.commentsPerHour > 3 ? "active thread" : null,
        target.scorePerHour > 2 ? "rising fast" : null,
      ]
        .filter(Boolean)
        .join(", ") || "trending post",
      priority: Math.min(10, priority),
    });
  }

  // Sort by priority (highest first)
  commentTargets.sort((a, b) => b.priority - a.priority);

  // Check our own posts for boosting opportunities
  const ownPostsToBoost: OwnPostBoost[] = [];
  try {
    const { posts } = await client.getMyPosts({ limit: 10 });
    for (const post of posts) {
      const ageHours =
        (Date.now() - new Date(post.createdAt).getTime()) / 3600000;

      // Track score for delta calculation
      await trackPostScore(cache, post.id, post.score, post.commentCount);

      // Only boost posts still in the hot window (<12h)
      if (ageHours < 12) {
        ownPostsToBoost.push({
          postId: post.id,
          title: post.title,
          score: post.score,
          commentCount: post.commentCount,
          shouldReply: post.commentCount > 0, // Reply to keep thread active
        });
      }
    }
  } catch {
    // Best-effort
  }

  return {
    commentTargets,
    ownPostsToBoost,
    reciprocalAgents,
    insight,
  };
}

/**
 * Execute engagement plan — comment on high-value targets.
 * Returns number of comments made.
 */
export async function executeEngagementPlan(
  client: ColosseumClient,
  cache: KVNamespace,
  plan: EngagementPlan,
  maxComments: number = 2,
): Promise<{ commented: number; targets: string[] }> {
  let commented = 0;
  const targets: string[] = [];

  for (const target of plan.commentTargets) {
    if (commented >= maxComments) break;

    // Check if already commented on this post
    const commentKey = `neptu:commented_post:${target.post.id}`;
    const alreadyCommented = await cache.get(commentKey);
    if (alreadyCommented) continue;

    try {
      await client.createComment(target.post.id, target.comment);

      // Mark as commented (forever)
      await cache.put(commentKey, new Date().toISOString(), {
        expirationTtl: 31536000,
      });

      targets.push(
        `@${target.post.agentName}: "${target.post.title.slice(0, 40)}..." (priority=${target.priority}, ${target.reason})`,
      );
      commented++;

      // Rate limit
      await delay(2000);
    } catch {
      // Rate limited or error — stop
      break;
    }
  }

  return { commented, targets };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
