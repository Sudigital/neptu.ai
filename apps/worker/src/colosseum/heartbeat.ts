/**
 * Neptu Heartbeat System
 * Handles periodic sync with Colosseum hackathon
 *
 * PRIORITY ORDER (strict):
 * 1st — Reply to ALL comments from other agents (exhaust every thread)
 * 2nd — Post new content
 * 3rd — Vote on posts & projects
 * 4th — Other activities (promos, leaderboard, birthdays, mentions)
 * Then repeat 1st after ~5 min
 */

import { ColosseumClient } from "./client";
import { ForumAgent } from "./forum-agent";
import {
  countPosts,
  countComments,
  countForumVotes,
  countProjectVotes,
  countMentions,
  replyToAllComments,
} from "./heartbeat-helpers";

export interface HeartbeatEnv {
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID?: string;
  COLOSSEUM_AGENT_NAME?: string;
  CACHE: KVNamespace;
}

export interface HeartbeatResult {
  timestamp: string;
  tasks: {
    name: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }[];
  nextSteps: string[];
}

// Task cooldowns in seconds
const TASK_COOLDOWNS: Record<string, number> = {
  check_status: 300, // 5 min — always check
  reply_to_comments: 0, // NO cooldown — always run first
  trend_detection: 1800, // 30 min
  process_birthday_requests: 600, // 10 min
  orchestrate_posting: 1800, // 30 min
  intelligent_voting: 900, // 15 min
  project_voting: 1200, // 20 min
  forum_engagement: 600, // 10 min
  respond_to_mentions: 600, // 10 min
  promo_comments: 900, // 15 min
  check_leaderboard: 1800, // 30 min
};

export class HeartbeatScheduler {
  private client: ColosseumClient;
  private forumAgent: ForumAgent;
  private cache: KVNamespace;

  constructor(env: HeartbeatEnv) {
    this.client = new ColosseumClient(env);
    this.forumAgent = new ForumAgent(env);
    this.cache = env.CACHE;
  }

  /**
   * Check if a task is on cooldown
   */
  private async isOnCooldown(taskName: string): Promise<boolean> {
    const key = `neptu:task_cooldown:${taskName}`;
    const lastRun = await this.cache.get(key);
    return lastRun !== null;
  }

  /**
   * Set task cooldown
   */
  private async setCooldown(taskName: string): Promise<void> {
    const key = `neptu:task_cooldown:${taskName}`;
    const ttl = TASK_COOLDOWNS[taskName] || 600;
    await this.cache.put(key, new Date().toISOString(), { expirationTtl: ttl });
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Run the full heartbeat cycle with strict priority order:
   * 1st — Reply to ALL comments (exhaust)
   * 2nd — Post
   * 3rd — Vote
   * 4th — Other
   * Then repeat 1st
   */
  async runHeartbeat(): Promise<HeartbeatResult> {
    const result: HeartbeatResult = {
      timestamp: new Date().toISOString(),
      tasks: [],
      nextSteps: [],
    };

    // ─── ALWAYS: Check status (lightweight) ───
    try {
      const status = await this.client.getStatus();
      result.tasks.push({
        name: "check_status",
        success: true,
        result: {
          agentStatus: status.agent.status,
          hackathonStatus: status.hackathon.status,
          engagement: status.engagement,
        },
      });
      result.nextSteps = status.nextSteps || [];
      await this.setCooldown("check_status");
    } catch (error) {
      result.tasks.push({
        name: "check_status",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // ─── ALWAYS: Check intro post (one-time) ───
    try {
      const introPostId = await this.cache.get("neptu:intro_post_id");
      if (!introPostId) {
        const post = await this.forumAgent.postIntroduction();
        result.tasks.push({
          name: "post_introduction",
          success: true,
          result: { postId: post.id, title: post.title },
        });
      } else {
        result.tasks.push({
          name: "post_introduction",
          success: true,
          result: { alreadyPosted: true, postId: parseInt(introPostId) },
        });
      }
    } catch (error) {
      result.tasks.push({
        name: "post_introduction",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // ═══════════════════════════════════════════
    // PRIORITY 1: Reply to ALL comments first
    // ═══════════════════════════════════════════
    console.log("PRIORITY 1: Replying to all unreplied comments...");
    try {
      const replyResult = await replyToAllComments(
        this.client,
        this.forumAgent,
        this.cache,
      );
      result.tasks.push({
        name: "reply_to_comments",
        success: true,
        result: replyResult,
      });
      console.log(
        `Replied to ${replyResult.replied} comments across ${replyResult.threadsChecked} threads`,
      );
    } catch (error) {
      result.tasks.push({
        name: "reply_to_comments",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // ═══════════════════════════════════════════
    // PRIORITY 2: Post new content
    // ═══════════════════════════════════════════
    const postTasks = [
      {
        name: "orchestrate_posting",
        run: async () => {
          const orchestrated = await this.forumAgent.orchestratePosting();
          return {
            posted: orchestrated.posted !== null,
            reason: orchestrated.reason,
            nextAction: orchestrated.nextAction,
          };
        },
      },
      {
        name: "trend_detection",
        run: async () => {
          const trendPost = await this.forumAgent.considerTrendPost();
          return trendPost
            ? { posted: true, postId: trendPost.id, title: trendPost.title }
            : { posted: false, reason: "No trending opportunity" };
        },
      },
    ];

    console.log("PRIORITY 2: Posting...");
    for (const task of postTasks) {
      if (await this.isOnCooldown(task.name)) {
        console.log(`  Skipped ${task.name} (cooldown)`);
        continue;
      }
      try {
        const taskResult = await task.run();
        await this.setCooldown(task.name);
        result.tasks.push({
          name: task.name,
          success: true,
          result: taskResult,
        });
      } catch (error) {
        result.tasks.push({
          name: task.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // ═══════════════════════════════════════════
    // PRIORITY 3: Vote on posts & projects
    // ═══════════════════════════════════════════
    const voteTasks = [
      {
        name: "intelligent_voting",
        run: async () => {
          const voteResult = await this.forumAgent.runIntelligentVoting();
          return {
            voted: voteResult.voted,
            skipped: voteResult.skipped,
            reasons: voteResult.reasons,
          };
        },
      },
      {
        name: "project_voting",
        run: async () => {
          const projectVoteResult =
            await this.forumAgent.voteOnProjectsStrategically();
          return {
            voted: projectVoteResult.voted,
            skipped: projectVoteResult.skipped,
            votedProjects: projectVoteResult.votedProjects,
            reasons: projectVoteResult.reasons,
          };
        },
      },
      {
        name: "forum_engagement",
        run: async () => {
          return await this.forumAgent.engageWithForum();
        },
      },
    ];

    console.log("PRIORITY 3: Voting...");
    for (const task of voteTasks) {
      if (await this.isOnCooldown(task.name)) {
        console.log(`  Skipped ${task.name} (cooldown)`);
        continue;
      }
      try {
        const taskResult = await task.run();
        await this.setCooldown(task.name);
        result.tasks.push({
          name: task.name,
          success: true,
          result: taskResult,
        });
      } catch (error) {
        result.tasks.push({
          name: task.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // ═══════════════════════════════════════════
    // PRIORITY 4: Other activities
    // ═══════════════════════════════════════════
    const otherTasks = [
      {
        name: "process_birthday_requests",
        run: async () => {
          const processed = await this.forumAgent.processBirthdayRequests();
          return { processedCount: processed };
        },
      },
      {
        name: "respond_to_mentions",
        run: async () => {
          const responses = await this.forumAgent.respondToMentions();
          return { responsesCount: responses };
        },
      },
      {
        name: "promo_comments",
        run: async () => {
          const promoComments = await this.forumAgent.commentOnAgentPosts();
          return { commentsPosted: promoComments };
        },
      },
      {
        name: "check_leaderboard",
        run: async () => {
          const { leaderboard } = await this.client.getLeaderboard();
          const myProject = await this.client.getMyProject().catch(() => null);
          if (myProject) {
            const myPosition = leaderboard.findIndex(
              (entry) => entry.project.id === myProject.project.id,
            );
            return {
              position: myPosition >= 0 ? myPosition + 1 : null,
              totalProjects: leaderboard.length,
              topProject: leaderboard[0]?.project.name,
            };
          }
          return { message: "No project created yet" };
        },
      },
    ];

    console.log("PRIORITY 4: Other activities...");
    // Shuffle other tasks so they rotate, pick up to 2
    const availableOther = [];
    for (const task of otherTasks) {
      if (!(await this.isOnCooldown(task.name))) {
        availableOther.push(task);
      }
    }
    const shuffledOther = this.shuffle(availableOther).slice(0, 2);

    for (const task of shuffledOther) {
      try {
        const taskResult = await task.run();
        await this.setCooldown(task.name);
        result.tasks.push({
          name: task.name,
          success: true,
          result: taskResult,
        });
      } catch (error) {
        result.tasks.push({
          name: task.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // ═══════════════════════════════════════════
    // REPEAT PRIORITY 1: Reply again after doing other work
    // (catches any new comments that came in during this cycle)
    // ═══════════════════════════════════════════
    console.log("REPEAT PRIORITY 1: Final reply sweep...");
    try {
      const finalReplyResult = await replyToAllComments(
        this.client,
        this.forumAgent,
        this.cache,
      );
      if (finalReplyResult.replied > 0) {
        result.tasks.push({
          name: "reply_to_comments_final",
          success: true,
          result: finalReplyResult,
        });
        console.log(
          `Final sweep: replied to ${finalReplyResult.replied} more comments`,
        );
      }
    } catch (error) {
      result.tasks.push({
        name: "reply_to_comments_final",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Track analytics (always, lightweight)
    try {
      const successTasks = result.tasks.filter((t) => t.success);
      const failedTasks = result.tasks.filter((t) => !t.success);

      const forumVotes = countForumVotes(result.tasks);
      const projectVotes = countProjectVotes(result.tasks);

      await this.forumAgent.trackEngagement("heartbeat", true, {
        posts: countPosts(result.tasks),
        comments: countComments(result.tasks),
        forumVotes,
        projectVotes,
        mentions: countMentions(result.tasks),
        successfulTasks: successTasks.length,
        failedTasks: failedTasks.length,
        selectedTasks: result.tasks.map((t: { name: string }) => t.name),
      });

      // Accumulate total votes given in KV
      const newVotes = forumVotes + projectVotes;
      if (newVotes > 0) {
        const prev = parseInt(
          (await this.cache.get("neptu:total_votes_given")) || "0",
          10,
        );
        await this.cache.put(
          "neptu:total_votes_given",
          String(prev + newVotes),
        );
      }

      result.tasks.push({
        name: "track_analytics",
        success: true,
        result: {
          successfulTasks: successTasks.length,
          failedTasks: failedTasks.length,
        },
      });
    } catch (error) {
      result.tasks.push({
        name: "track_analytics",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Store heartbeat result
    await this.cache.put("neptu:last_heartbeat", JSON.stringify(result), {
      expirationTtl: 86400,
    });

    return result;
  }

  /**
   * Run a quick status check (lighter than full heartbeat)
   */
  async quickCheck(): Promise<{
    status: string;
    lastHeartbeat: string | null;
    nextSteps: string[];
  }> {
    const status = await this.client.getStatus();
    const lastHeartbeat = await this.cache.get("neptu:last_heartbeat");

    return {
      status: status.agent.status,
      lastHeartbeat: lastHeartbeat ? JSON.parse(lastHeartbeat).timestamp : null,
      nextSteps: status.nextSteps || [],
    };
  }

  /**
   * Post a scheduled progress update
   */
  async postScheduledUpdate(): Promise<void> {
    // Get current stats
    const stats = await this.forumAgent.getStats();

    // Determine what to highlight
    const achievements: string[] = [];
    const _nextSteps: string[] = [];

    if (stats.myPosts > 0) {
      achievements.push(`Posted ${stats.myPosts} forum threads`);
    }
    if (stats.myComments > 0) {
      achievements.push(
        `Engaged with ${stats.myComments} community discussions`,
      );
    }
    if (stats.status.engagement.votesReceived > 0) {
      achievements.push(
        `Received ${stats.status.engagement.votesReceived} upvotes`,
      );
    }

    // Only post if we have meaningful achievements
    if (achievements.length >= 2) {
      // Check if we've posted an update recently
      const lastUpdate = await this.cache.get("neptu:last_progress_update");
      const hoursSinceUpdate = lastUpdate
        ? (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60)
        : 999;

      if (hoursSinceUpdate > 12) {
        // Only post every 12+ hours
        await this.forumAgent.postProgressUpdate({
          title: "Building the Bridge Between Ancient Wisdom and Web3",
          achievements,
          nextSteps: [
            "Complete AI Oracle integration",
            "Add more Wuku cycle insights",
            "Enhance token reward mechanics",
          ],
          callToAction:
            "🎁 Want a free personalized reading? Reply with: `BIRTHDAY: YYYY-MM-DD`",
        });

        await this.cache.put(
          "neptu:last_progress_update",
          new Date().toISOString(),
        );
      }
    }
  }
}
