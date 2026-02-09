/**
 * Neptu Heartbeat System
 * Handles periodic sync with Colosseum hackathon
 *
 * Five separate cron schedules:
 * Every 3 min  — Reply to all comments on own posts
 * Every 5 min  — Comment on other agent posts (smart priority)
 * Every 10 min — Post new thread
 * Every 15 min — Votes (forum + project)
 * Every 20 min — Other activities (trends, mentions, birthday, leaderboard)
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
  smartCommentOnOtherPosts,
  syncDedupCache,
} from "./heartbeat-helpers";

export interface HeartbeatEnv {
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID?: string;
  COLOSSEUM_AGENT_NAME?: string;
  CACHE: KVNamespace;
  DB?: D1Database;
}

export type HeartbeatPhase =
  | "reply_comments"
  | "comment_others"
  | "post_thread"
  | "vote"
  | "other_activity";

export interface HeartbeatResult {
  timestamp: string;
  phase: HeartbeatPhase;
  tasks: {
    name: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }[];
  nextSteps: string[];
}

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
   * Run heartbeat with explicit phase (with 25s global timeout):
   * reply_comments  — Reply to all comments on own posts
   * comment_others  — Comment on other agent posts (smart priority)
   * post_thread     — Post new thread via orchestrator
   * vote            — Forum + project voting
   * other_activity  — Trends, mentions, birthday, leaderboard
   */
  async runHeartbeat(phase: HeartbeatPhase): Promise<HeartbeatResult> {
    const result: HeartbeatResult = {
      timestamp: new Date().toISOString(),
      phase,
      tasks: [],
      nextSteps: [],
    };

    // Global 25s timeout — Cloudflare Workers scheduled events have limits
    const startTime = Date.now();
    const GLOBAL_TIMEOUT_MS = 25000;
    const isTimedOut = () => Date.now() - startTime > GLOBAL_TIMEOUT_MS;

    // ─── ALWAYS: Quick status check ───
    try {
      const status = await this.client.getStatus();
      result.tasks.push({
        name: "check_status",
        success: true,
        result: {
          agentStatus: status?.agent?.status ?? "unknown",
          hackathonStatus: status?.hackathon?.status ?? "unknown",
          engagement: status?.engagement ?? {},
        },
      });
      result.nextSteps = status?.nextSteps || [];
    } catch (error) {
      result.tasks.push({
        name: "check_status",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // ─── ALWAYS: Intro post (one-time) ───
    try {
      const introPostId = await this.cache.get("neptu:intro_post_id");
      if (!introPostId) {
        const post = await this.forumAgent.postIntroduction();
        result.tasks.push({
          name: "post_introduction",
          success: true,
          result: { postId: post.id, title: post.title },
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
    // Pre-check: sync dedup cache from API
    // ═══════════════════════════════════════════
    if (!isTimedOut()) {
      try {
        const synced = await syncDedupCache(this.client, this.cache);
        result.tasks.push({
          name: "sync_dedup",
          success: true,
          result: { syncedCommentedPosts: synced },
        });
      } catch (error) {
        result.tasks.push({
          name: "sync_dedup",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // ═══════════════════════════════════════════
    // Execute phase
    // ═══════════════════════════════════════════
    console.log(`HEARTBEAT Phase: ${phase}`);

    switch (phase) {
      case "reply_comments":
        await this.phaseReplyComments(result, isTimedOut);
        break;
      case "comment_others":
        await this.phaseCommentOthers(result, isTimedOut);
        break;
      case "post_thread":
        await this.phasePostThread(result, isTimedOut);
        break;
      case "vote":
        await this.phaseVote(result, isTimedOut);
        break;
      case "other_activity":
        await this.phaseOtherActivity(result, isTimedOut);
        break;
    }

    // ─── Track analytics (skip if timed out) ───
    if (!isTimedOut()) {
      await this.trackAnalytics(result);
    }

    // Store heartbeat result (best-effort)
    try {
      await this.cache.put("neptu:last_heartbeat", JSON.stringify(result), {
        expirationTtl: 86400,
      });
    } catch {
      console.warn("KV write failed for last_heartbeat");
    }

    return result;
  }

  /**
   * Phase: Reply to all comments on own posts
   * Runs every 3 min
   */
  private async phaseReplyComments(
    result: HeartbeatResult,
    _isTimedOut: () => boolean,
  ): Promise<void> {
    console.log("REPLY: Replying to all unreplied comments on own posts...");
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
  }

  /**
   * Phase: Comment on other agent posts with smart priority
   * Runs every 5 min
   * Priority:
   *   1. Posts with 0 comments (be first commenter)
   *   2. Posts where own comment was replied to (continue thread)
   *   3. Posts with >1 comments (join discussion)
   */
  private async phaseCommentOthers(
    result: HeartbeatResult,
    isTimedOut: () => boolean,
  ): Promise<void> {
    console.log("COMMENT: Commenting on other agent posts (smart priority)...");
    try {
      const commentResult = await smartCommentOnOtherPosts(
        this.client,
        this.forumAgent,
        this.cache,
        isTimedOut,
      );
      result.tasks.push({
        name: "smart_comment",
        success: true,
        result: commentResult,
      });
    } catch (error) {
      result.tasks.push({
        name: "smart_comment",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Phase: Post new thread via orchestrator
   * Runs every 10 min
   */
  private async phasePostThread(
    result: HeartbeatResult,
    isTimedOut: () => boolean,
  ): Promise<void> {
    console.log("POST: Posting new thread...");
    try {
      const orchestrated = await this.forumAgent.orchestratePosting();
      result.tasks.push({
        name: "orchestrate_posting",
        success: true,
        result: {
          posted: orchestrated.posted !== null,
          reason: orchestrated.reason,
          nextAction: orchestrated.nextAction,
        },
      });
    } catch (error) {
      result.tasks.push({
        name: "orchestrate_posting",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    if (isTimedOut()) return;
    try {
      const trendPost = await this.forumAgent.considerTrendPost();
      result.tasks.push({
        name: "trend_post",
        success: true,
        result: trendPost
          ? { posted: true, postId: trendPost.id, title: trendPost.title }
          : { posted: false, reason: "No trending opportunity" },
      });
    } catch (error) {
      result.tasks.push({
        name: "trend_post",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Phase: Vote on forum posts + projects
   * Runs every 15 min
   */
  private async phaseVote(
    result: HeartbeatResult,
    isTimedOut: () => boolean,
  ): Promise<void> {
    console.log("VOTE: Voting on forum posts + projects...");

    // Forum voting
    try {
      const voteResult = await this.forumAgent.runIntelligentVoting();
      result.tasks.push({
        name: "intelligent_voting",
        success: true,
        result: {
          voted: voteResult.voted,
          skipped: voteResult.skipped,
          reasons: voteResult.reasons,
        },
      });
    } catch (error) {
      result.tasks.push({
        name: "intelligent_voting",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Forum engagement voting (hot posts)
    if (isTimedOut()) return;
    try {
      const engagement = await this.forumAgent.engageWithForum();
      result.tasks.push({
        name: "forum_engagement_votes",
        success: true,
        result: engagement,
      });
    } catch (error) {
      result.tasks.push({
        name: "forum_engagement_votes",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Project voting
    if (isTimedOut()) return;
    try {
      const projectVoteResult =
        await this.forumAgent.voteOnProjectsStrategically();
      result.tasks.push({
        name: "project_voting",
        success: true,
        result: {
          voted: projectVoteResult.voted,
          skipped: projectVoteResult.skipped,
          votedProjects: projectVoteResult.votedProjects,
          reasons: projectVoteResult.reasons,
        },
      });
    } catch (error) {
      result.tasks.push({
        name: "project_voting",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Phase: Other activities (mentions, birthday, leaderboard)
   * Runs every 20 min
   */
  private async phaseOtherActivity(
    result: HeartbeatResult,
    isTimedOut: () => boolean,
  ): Promise<void> {
    console.log("OTHER: Running other activities...");
    const otherTasks = [
      {
        name: "respond_to_mentions",
        run: async () => {
          const responses = await this.forumAgent.respondToMentions();
          return { responsesCount: responses };
        },
      },
      {
        name: "process_birthday_requests",
        run: async () => {
          const processed = await this.forumAgent.processBirthdayRequests();
          return { processedCount: processed };
        },
      },
      {
        name: "check_leaderboard",
        run: async () => {
          const data = await this.client.getLeaderboard();
          const leaderboard = data?.leaderboard || [];
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

    for (const task of this.shuffle(otherTasks)) {
      if (isTimedOut()) break;
      try {
        const taskResult = await task.run();
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
  }

  /**
   * Track analytics + accumulate vote count in KV
   */
  private async trackAnalytics(result: HeartbeatResult): Promise<void> {
    try {
      const successTasks = result.tasks.filter((t) => t.success);
      const failedTasks = result.tasks.filter((t) => !t.success);
      const forumVotes = countForumVotes(result.tasks);
      const projectVotes = countProjectVotes(result.tasks);

      await this.forumAgent.trackEngagement("heartbeat", true, {
        phase: result.phase,
        posts: countPosts(result.tasks),
        comments: countComments(result.tasks),
        forumVotes,
        projectVotes,
        mentions: countMentions(result.tasks),
        successfulTasks: successTasks.length,
        failedTasks: failedTasks.length,
      });

      // Accumulate total votes given in KV (best-effort)
      const newVotes = forumVotes + projectVotes;
      if (newVotes > 0) {
        try {
          const prev = parseInt(
            (await this.cache.get("neptu:total_votes_given")) || "0",
            10,
          );
          await this.cache.put(
            "neptu:total_votes_given",
            String(prev + newVotes),
          );
        } catch {
          console.warn("KV write failed for total_votes_given");
        }
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
  }
}
