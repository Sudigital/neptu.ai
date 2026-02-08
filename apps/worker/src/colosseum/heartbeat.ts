/**
 * Neptu Heartbeat System
 * Handles periodic sync with Colosseum hackathon
 *
 * Two separate cron schedules:
 * Every 3 min (3,6,...,54) — Reply to all comments + other activities
 * Every 5 min (5,10,...,55) — Vote + comment on other projects
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
  DB?: D1Database;
}

export type HeartbeatPhase = "reply_and_other" | "vote_and_comment";

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
   * reply_and_other: reply all comments + post + other activities
   * vote_and_comment: vote + comment on other projects
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
    // Execute phase
    // ═══════════════════════════════════════════
    console.log(`HEARTBEAT Phase: ${phase}`);

    if (phase === "reply_and_other") {
      await this.phaseReplyAndOther(result, isTimedOut);
    } else {
      await this.phaseVoteAndComment(result, isTimedOut);
    }

    // ─── Track analytics (skip if timed out) ───
    if (!isTimedOut()) {
      await this.trackAnalytics(result);
    }

    // Store heartbeat result
    await this.cache.put("neptu:last_heartbeat", JSON.stringify(result), {
      expirationTtl: 86400,
    });

    return result;
  }

  /**
   * Phase: Reply to all comments on own posts + other activities
   * Runs every 3 min (3,6,9,...,54)
   */
  private async phaseReplyAndOther(
    result: HeartbeatResult,
    isTimedOut: () => boolean,
  ): Promise<void> {
    // ── Reply to all comments ──
    console.log("REPLY+OTHER: Replying to all unreplied comments...");
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

    // ── Post new topic ──
    if (isTimedOut()) return;
    console.log("REPLY+OTHER: Posting new topic...");
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

    try {
      const trendPost = await this.forumAgent.considerTrendPost();
      result.tasks.push({
        name: "trend_detection",
        success: true,
        result: trendPost
          ? { posted: true, postId: trendPost.id, title: trendPost.title }
          : { posted: false, reason: "No trending opportunity" },
      });
    } catch (error) {
      result.tasks.push({
        name: "trend_detection",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // ── Other activities (birthday, mentions, leaderboard) ──
    if (isTimedOut()) return;
    console.log("REPLY+OTHER: Other activities...");
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
   * Phase: Vote + comment on other projects
   * Runs every 5 min (5,10,15,...,55)
   */
  private async phaseVoteAndComment(
    result: HeartbeatResult,
    isTimedOut: () => boolean,
  ): Promise<void> {
    console.log("VOTE+COMMENT: Voting + commenting on other projects...");

    // Vote on forum posts
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

    // Vote on projects strategically
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

    // Comment on other agent posts (engage with forum)
    if (isTimedOut()) return;
    try {
      const engagement = await this.forumAgent.engageWithForum();
      result.tasks.push({
        name: "forum_engagement",
        success: true,
        result: engagement,
      });
    } catch (error) {
      result.tasks.push({
        name: "forum_engagement",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Promo comments on other posts
    if (isTimedOut()) return;
    try {
      const promoComments = await this.forumAgent.commentOnAgentPosts();
      result.tasks.push({
        name: "promo_comments",
        success: true,
        result: { commentsPosted: promoComments },
      });
    } catch (error) {
      result.tasks.push({
        name: "promo_comments",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
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
    const stats = await this.forumAgent.getStats();

    const achievements: string[] = [];

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

    if (achievements.length >= 2) {
      const lastUpdate = await this.cache.get("neptu:last_progress_update");
      const hoursSinceUpdate = lastUpdate
        ? (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60)
        : 999;

      if (hoursSinceUpdate > 12) {
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
