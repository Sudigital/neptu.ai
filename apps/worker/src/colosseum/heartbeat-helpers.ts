/**
 * Heartbeat helper functions
 * Analytics counters + comment reply logic
 */

import { ColosseumClient } from "./client";
import { ForumAgent } from "./forum-agent";
import { generateReply } from "./reply-generator";

type TaskEntry = {
  name: string;
  success: boolean;
  result?: unknown;
  error?: string;
};

// Helper methods for analytics counting
export function countPosts(tasks: TaskEntry[]): number {
  let count = 0;
  for (const task of tasks) {
    if (task.success && task.result && typeof task.result === "object") {
      const r = task.result as Record<string, unknown>;
      if (r.posted === true) count++;
    }
  }
  return count;
}

export function countComments(tasks: TaskEntry[]): number {
  let count = 0;
  for (const task of tasks) {
    if (task.success && task.result && typeof task.result === "object") {
      const r = task.result as Record<string, unknown>;
      if (typeof r.commentsPosted === "number") count += r.commentsPosted;
      if (typeof r.commented === "number") count += r.commented;
      if (typeof r.processedCount === "number") count += r.processedCount;
      if (typeof r.replied === "number") count += r.replied;
    }
  }
  return count;
}

export function countForumVotes(tasks: TaskEntry[]): number {
  let count = 0;
  for (const task of tasks) {
    if (
      task.name === "intelligent_voting" &&
      task.success &&
      task.result &&
      typeof task.result === "object"
    ) {
      const r = task.result as Record<string, unknown>;
      if (typeof r.voted === "number") count += r.voted;
    }
  }
  return count;
}

export function countProjectVotes(tasks: TaskEntry[]): number {
  let count = 0;
  for (const task of tasks) {
    if (
      task.name === "project_voting" &&
      task.success &&
      task.result &&
      typeof task.result === "object"
    ) {
      const r = task.result as Record<string, unknown>;
      if (typeof r.voted === "number") count += r.voted;
    }
  }
  return count;
}

export function countMentions(tasks: TaskEntry[]): number {
  let count = 0;
  for (const task of tasks) {
    if (task.success && task.result && typeof task.result === "object") {
      const r = task.result as Record<string, unknown>;
      if (typeof r.responsesCount === "number") count += r.responsesCount;
    }
  }
  return count;
}

/**
 * PRIORITY 1: Reply to ALL unreplied comments on our threads.
 * Exhausts every thread — no comment left behind.
 * NEVER replies to own comments.
 */
export async function replyToAllComments(
  client: ColosseumClient,
  forumAgent: ForumAgent,
  cache: KVNamespace,
): Promise<{
  replied: number;
  threadsChecked: number;
  skippedOwn: number;
  errors: number;
}> {
  let replied = 0;
  let threadsChecked = 0;
  let skippedOwn = 0;
  let errors = 0;
  const selfName =
    (forumAgent as unknown as { agentName: string }).agentName?.toLowerCase() ||
    "neptu";
  const selfId = parseInt(
    (forumAgent as unknown as { agentId: string }).agentId || "206",
  );

  // Limits per cycle to avoid worker timeout
  const MAX_POSTS = 5;
  const MAX_REPLIES_PER_POST = 3;

  try {
    // Get our posts (newest first so we reply to recent ones)
    const { posts } = await client.getMyPosts({ limit: MAX_POSTS });

    for (const post of posts) {
      threadsChecked++;

      // Get all comments on this post
      const { comments } = await client.listComments(post.id, {
        sort: "new",
        limit: 50,
      });

      for (const comment of comments) {
        // Stop if we've hit the per-post reply limit
        if (replied >= MAX_REPLIES_PER_POST * threadsChecked) break;
        // NEVER reply to own comments (case-insensitive + ID check)
        if ((comment.agentName || "").toLowerCase() === selfName) {
          skippedOwn++;
          continue;
        }
        if (comment.agentId === selfId) {
          skippedOwn++;
          continue;
        }

        // Check if already replied to this comment (check both keys for compat)
        const replyKey = `neptu:replied_comment:${comment.id}`;
        const processedKey = `neptu:processed_comment:${comment.id}`;
        const [alreadyReplied, alreadyProcessed] = await Promise.all([
          cache.get(replyKey),
          cache.get(processedKey),
        ]);
        if (alreadyReplied || alreadyProcessed) continue;

        // Generate reply based on comment content
        const reply = generateReply(
          forumAgent,
          comment.agentName,
          comment.body,
          post.title,
        );

        try {
          await client.createComment(post.id, reply);
          // Mark both keys to prevent any other task from re-replying
          await Promise.all([
            cache.put(replyKey, new Date().toISOString(), {
              expirationTtl: 31536000,
            }),
            cache.put(processedKey, new Date().toISOString(), {
              expirationTtl: 31536000,
            }),
          ]);
          replied++;
          console.log(
            `Replied to ${comment.agentName} on "${post.title.slice(0, 40)}..."`,
          );

          // Rate limit: 2s between comments (Colosseum: 30 comments/hour)
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (e) {
          errors++;
          console.error(`Failed to reply to comment ${comment.id}:`, e);
          // Rate limited — stop this thread, try next
          break;
        }
      }
    }
  } catch (e) {
    errors++;
    console.error("Failed to fetch posts for reply:", e);
  }

  return { replied, threadsChecked, skippedOwn, errors };
}
