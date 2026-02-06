/**
 * Neptu Heartbeat System
 * Handles periodic sync with Colosseum hackathon
 */

import { ColosseumClient } from "./client";
import { ForumAgent } from "./forum-agent";

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
   * Run the full heartbeat cycle
   * Called at :00 and :55 each hour via cron
   */
  async runHeartbeat(): Promise<HeartbeatResult> {
    const result: HeartbeatResult = {
      timestamp: new Date().toISOString(),
      tasks: [],
      nextSteps: [],
    };

    // Task 1: Check agent status
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
    } catch (error) {
      result.tasks.push({
        name: "check_status",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Task 2: Check for introduction post
    try {
      const introPostId = await this.cache.get("neptu:intro_post_id");
      if (!introPostId) {
        // Post introduction if we haven't yet
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

    // Task 3: Process birthday requests
    try {
      const processed = await this.forumAgent.processBirthdayRequests();
      result.tasks.push({
        name: "process_birthday_requests",
        success: true,
        result: { processedCount: processed },
      });
    } catch (error) {
      result.tasks.push({
        name: "process_birthday_requests",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Task 4: Engage with forum
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

    // Task 5: Respond to mentions/relevant discussions
    try {
      const responses = await this.forumAgent.respondToMentions();
      result.tasks.push({
        name: "respond_to_mentions",
        success: true,
        result: { responsesCount: responses },
      });
    } catch (error) {
      result.tasks.push({
        name: "respond_to_mentions",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Task 6: Post deadline promotion (once per day)
    try {
      const promoPost = await this.forumAgent.postDeadlinePromotion();
      result.tasks.push({
        name: "deadline_promotion",
        success: true,
        result: promoPost
          ? { posted: true, postId: promoPost.id, title: promoPost.title }
          : { posted: false, reason: "Already posted today" },
      });
    } catch (error) {
      result.tasks.push({
        name: "deadline_promotion",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Task 7: Comment on other agents' posts (max 5 per heartbeat)
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

    // Task 8: Check leaderboard position
    try {
      const { leaderboard } = await this.client.getLeaderboard();
      const myProject = await this.client.getMyProject().catch(() => null);

      if (myProject) {
        const myPosition = leaderboard.findIndex(
          (entry) => entry.project.id === myProject.project.id,
        );

        result.tasks.push({
          name: "check_leaderboard",
          success: true,
          result: {
            position: myPosition >= 0 ? myPosition + 1 : null,
            totalProjects: leaderboard.length,
            topProject: leaderboard[0]?.project.name,
          },
        });
      } else {
        result.tasks.push({
          name: "check_leaderboard",
          success: true,
          result: { message: "No project created yet" },
        });
      }
    } catch (error) {
      result.tasks.push({
        name: "check_leaderboard",
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
