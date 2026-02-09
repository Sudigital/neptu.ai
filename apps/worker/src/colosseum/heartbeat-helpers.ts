/**
 * Heartbeat helper functions
 * Analytics counters + comment reply logic
 */

import { ColosseumClient, type ForumPost } from "./client";
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

/**
 * Smart comment on other agent posts with priority-based strategy:
 * 1. Posts with 0 comments → be first commenter (+1, next)
 * 2. Posts where own comment was replied to → continue thread (+1, next)
 * 3. Posts with >1 comments → join discussion (+1, next)
 */
export async function smartCommentOnOtherPosts(
  client: ColosseumClient,
  forumAgent: ForumAgent,
  cache: KVNamespace,
  isTimedOut: () => boolean,
): Promise<{
  commented: number;
  priority1: number;
  priority2: number;
  priority3: number;
  skipped: number;
}> {
  let commented = 0;
  let priority1 = 0;
  let priority2 = 0;
  let priority3 = 0;
  let skipped = 0;
  const MAX_COMMENTS = 3;
  const selfName =
    (forumAgent as unknown as { agentName: string }).agentName || "Neptu";
  const selfId = parseInt(
    (forumAgent as unknown as { agentId: string }).agentId || "206",
  );

  try {
    const { posts } = await client.listPosts({ sort: "new", limit: 60 });

    const candidates: { post: ForumPost; priority: 1 | 2 | 3 }[] = [];

    for (const post of posts) {
      if (isTimedOut()) break;

      // Skip own posts
      if (
        (post.agentName || "").toLowerCase() === selfName.toLowerCase() ||
        post.agentId === selfId
      )
        continue;

      // Check if already commented
      const commentKey = `neptu:commented_post:${post.id}`;
      const alreadyCommented = await cache.get(commentKey);
      if (alreadyCommented) {
        skipped++;
        continue;
      }

      // P1: Posts with 0 comments (be first commenter)
      if (post.commentCount < 1) {
        candidates.push({ post, priority: 1 });
        continue;
      }

      // P2: Posts where our comment got a reply
      const repliedKey = `neptu:got_reply_on:${post.id}`;
      const gotReply = await cache.get(repliedKey);
      if (gotReply) {
        candidates.push({ post, priority: 2 });
        continue;
      }

      // P3: Posts with >1 comments (active discussion)
      if (post.commentCount > 1) {
        candidates.push({ post, priority: 3 });
      }
    }

    // Sort by priority (1 first)
    candidates.sort((a, b) => a.priority - b.priority);

    for (const { post, priority } of candidates) {
      if (commented >= MAX_COMMENTS || isTimedOut()) break;

      const comment = await forumAgent.generateSmartComment(post);
      if (!comment) continue;

      try {
        await client.createComment(post.id, comment);
        await cache.put(
          `neptu:commented_post:${post.id}`,
          new Date().toISOString(),
          { expirationTtl: 31536000 },
        );

        commented++;
        if (priority === 1) priority1++;
        else if (priority === 2) priority2++;
        else priority3++;

        console.log(
          `[P${priority}] Commented on post ${post.id}: "${post.title.slice(0, 40)}..."`,
        );

        // Rate limit: 2s between comments
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        console.error(`Failed to comment on post ${post.id}:`, e);
        break;
      }
    }
  } catch (e) {
    console.error("Failed smartCommentOnOtherPosts:", e);
  }

  return { commented, priority1, priority2, priority3, skipped };
}

/**
 * Sync KV dedup cache from API to prevent duplicate posts/comments.
 * 1) Backfills commented_post keys from own recent comments
 * 2) Backfills replied_comment keys by scanning own post threads
 */
export async function syncDedupCache(
  client: ColosseumClient,
  cache: KVNamespace,
): Promise<number> {
  // Throttle: run at most once per hour to conserve KV writes
  const throttleKey = "neptu:dedup_sync_last";
  const lastSync = await cache.get(throttleKey);
  if (lastSync) {
    const elapsed = Date.now() - parseInt(lastSync, 10);
    if (elapsed < 3600000) {
      console.log(
        `syncDedupCache: skipped (${Math.round(elapsed / 60000)}m since last sync)`,
      );
      return 0;
    }
  }

  let synced = 0;

  // 1) Sync commented_post keys from own comments
  const { comments } = await client.getMyComments({ limit: 50, sort: "new" });
  const seenPosts = new Set<number>();
  for (const c of comments) {
    if (seenPosts.has(c.postId)) continue;
    seenPosts.add(c.postId);
    const key = `neptu:commented_post:${c.postId}`;
    if (!(await cache.get(key))) {
      try {
        await cache.put(key, "1", { expirationTtl: 31536000 });
        synced++;
      } catch {
        break; // KV limit hit, stop syncing
      }
    }
  }

  // 2) Sync replied_comment keys — scan own posts for already-replied comments
  const { posts } = await client.getMyPosts({ limit: 10 });
  for (const post of posts) {
    const { comments: threadComments } = await client.listComments(post.id, {
      sort: "new",
      limit: 50,
    });
    let lastOtherCommentId: number | null = null;
    for (const tc of threadComments) {
      const isOwn = (tc.agentName || "").toLowerCase() === "neptu";
      if (!isOwn) {
        lastOtherCommentId = tc.id;
      } else if (lastOtherCommentId !== null) {
        // Our comment follows another agent's → already replied
        const rk = `neptu:replied_comment:${lastOtherCommentId}`;
        if (!(await cache.get(rk))) {
          try {
            await cache.put(rk, "1", { expirationTtl: 31536000 });
            synced++;
          } catch {
            // KV limit hit
          }
        }
        lastOtherCommentId = null;
      }
    }
  }

  // Mark sync timestamp
  try {
    await cache.put(throttleKey, Date.now().toString(), {
      expirationTtl: 7200,
    });
  } catch {
    // KV limit — skip
  }

  return synced;
}
