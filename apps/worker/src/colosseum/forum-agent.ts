/** Neptu Forum Agent - Autonomous forum engagement for Colosseum hackathon */
import { ColosseumClient, type ForumPost, type AgentStatus } from "./client";
import { NeptuCalculator } from "@neptu/wariga";
import {
  generatePeluangReading,
  generateBirthdayResponse,
} from "./reading-generator";
import {
  generateSmartEngagement,
  generatePromoComment,
} from "./comment-generator";
import {
  postIntroduction,
  postProgressUpdate,
  postPeluangPredictions,
  postVoterRewards,
  postDeadlinePromotion,
} from "./post-creator";
import {
  runIntelligentVoting,
  calculateVoteScore,
  voteOnProjectsStrategically,
  type VoteResult,
  type ProjectVoteResult,
} from "./voting-strategy";
import {
  trackEngagement,
  getAnalytics,
  checkAgentEngagementLimit,
  incrementAgentEngagement,
  type AnalyticsData,
} from "./analytics";
import {
  orchestratePosting,
  shouldPostNow,
  type OrchestrateResult,
} from "./orchestrator";
import {
  detectHotTopics,
  postTrendResponse,
  generateTrendAwareComment,
  type HotTopicResult,
} from "./trend-detector";
import {
  extractBirthday,
  createBirthdayReply,
  createMentionResponse,
} from "./forum-helpers";
import {
  createEngagementPlan,
  executeEngagementPlan,
  type EngagementPlan,
} from "./engagement-booster";
import { analyzeTrending, type TrendingInsight } from "./trending-analyzer";
import type { CacheStore } from "../cache";
import type { Database } from "@neptu/drizzle-orm";
import {
  runCosmicProfileCampaign,
  getCampaignProgress,
  type CampaignResult,
} from "./agent-cosmic-profile";
import {
  runFinalDayForecast,
  getFinalForecastProgress,
  type FinalForecastResult,
} from "./final-day-forecast";

export interface ForumAgentEnv {
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID?: string;
  COLOSSEUM_AGENT_NAME?: string;
  CACHE: CacheStore;
  DB?: Database;
}

const COMMENT_RATE_LIMIT_MS = 2000; // 2 sec between comments
const CACHE_TTL_FOREVER = 31536000; // 1 year - effectively forever

// Colosseum limits per hour:
// - Forum posts/comments: 30/hour
// - Forum votes: 120/hour
// - Project votes: 60/hour
// Heartbeat runs every 5 min (12 runs/hour), small batches spread activity:
const MAX_COMMENTS_PER_HEARTBEAT = 4; // 4 per 5min × 12 = 48 comments/hour (limit 30, but capped by rate limits)
const MAX_FORUM_VOTES_PER_HEARTBEAT = 10; // 10 per 5min × 12 = 120 votes/hour

export class ForumAgent {
  private client: ColosseumClient;
  private cache: CacheStore;
  private calculator: NeptuCalculator;
  private agentName: string;
  private agentId: string;
  private db?: Database;

  constructor(env: ForumAgentEnv) {
    this.client = new ColosseumClient(env);
    this.cache = env.CACHE;
    this.calculator = new NeptuCalculator();
    this.agentName = env.COLOSSEUM_AGENT_NAME || "Neptu";
    this.agentId = env.COLOSSEUM_AGENT_ID || "206";
    this.db = env.DB;
  }

  /** Generate a personalized Peluang reading */
  generatePeluangReading(birthDate: string, targetDate?: string): string {
    return generatePeluangReading(this.calculator, birthDate, targetDate);
  }

  /** Generate birthday response with reading */
  generateBirthdayResponse(birthDate: string, agentName: string): string {
    return generateBirthdayResponse(this.calculator, birthDate, agentName);
  }

  /** Post introduction to forum */
  async postIntroduction(): Promise<ForumPost> {
    return postIntroduction(this.client, this.agentName, this.cache);
  }

  /** Post a progress update */
  async postProgressUpdate(update: {
    title: string;
    achievements: string[];
    nextSteps: string[];
    callToAction?: string;
  }): Promise<ForumPost> {
    return postProgressUpdate(this.client, update);
  }

  /** Post Peluang predictions */
  async postPeluangPredictions(): Promise<ForumPost> {
    return postPeluangPredictions(this.client, this.calculator, this.cache);
  }

  /** Post voter rewards */
  async postVoterRewards(): Promise<ForumPost> {
    return postVoterRewards(this.client, this.cache);
  }

  /** Post deadline promotion */
  async postDeadlinePromotion(): Promise<ForumPost> {
    return postDeadlinePromotion(this.client, this.calculator);
  }

  // =====================================================
  // Hot Topic Detection & Trend Response
  // =====================================================

  /**
   * Detect hot topics from recent forum posts
   */
  async detectHotTopics(): Promise<HotTopicResult> {
    return detectHotTopics(this.client);
  }

  /**
   * Post a trend-responsive thread if opportunity exists
   */
  async postTrendResponse(
    opportunity: string,
    relatedPosts: ForumPost[],
  ): Promise<ForumPost | null> {
    return postTrendResponse(
      this.client,
      this.cache,
      opportunity,
      relatedPosts,
    );
  }

  /**
   * Generate a trend-aware comment for a post
   */
  getTrendAwareComment(post: ForumPost): string | null {
    return generateTrendAwareComment(post);
  }

  /**
   * Check for trending opportunities and post if relevant
   */
  async considerTrendPost(): Promise<ForumPost | null> {
    const { topics, posts, opportunity } = await this.detectHotTopics();

    if (!opportunity) {
      return null;
    }

    console.log(`Detected trending topics: ${topics.join(", ")}`);
    console.log(`Neptu opportunity: ${opportunity}`);

    const trendPost = await this.postTrendResponse(opportunity, posts);

    if (trendPost) {
      console.log(`Posted trend response: ${trendPost.title}`);
    }

    return trendPost;
  }

  // =====================================================
  // Trending-Aware Engagement (v2)
  // =====================================================

  /**
   * Get current trending insight for the forum
   */
  async getTrendingInsight(): Promise<TrendingInsight> {
    return analyzeTrending(this.client, this.agentName);
  }

  /**
   * Create a trending-aware engagement plan.
   * Prioritizes high-value comment targets based on:
   * - Score velocity (rising posts)
   * - Reciprocity (agents who engaged with us)
   * - Trending agents (most visible)
   */
  async createTrendingEngagementPlan(): Promise<EngagementPlan> {
    return createEngagementPlan(this.client, this.cache, this.agentName);
  }

  /**
   * Execute engagement plan — comment on trending posts.
   * Returns number of comments made and target details.
   */
  async executeTrendingEngagement(
    plan: EngagementPlan,
    maxComments: number = MAX_COMMENTS_PER_HEARTBEAT,
  ): Promise<{ commented: number; targets: string[] }> {
    return executeEngagementPlan(this.client, this.cache, plan, maxComments);
  }

  // =====================================================
  // Community Engagement
  // =====================================================

  /**

   * Check for birthday requests in comments and respond.
   * STRICT: Only responds to NEW comments on our posts, never duplicate.
   * Guards: Skip own comments (case-insensitive), check post-level dedup.
   */
  async processBirthdayRequests(): Promise<number> {
    let processed = 0;
    const { posts } = await this.client.getMyPosts({ limit: 20 });
    const selfName = this.agentName.toLowerCase();

    for (const post of posts) {
      // Check post-level dedup — if another task already commented on this post, skip
      const postCommentKey = `neptu:commented_post:${post.id}`;
      const alreadyCommentedOnPost = await this.cache.get(postCommentKey);
      if (alreadyCommentedOnPost) continue;

      const { comments } = await this.client.listComments(post.id, {
        limit: 50,
      });

      for (const comment of comments) {
        // Case-insensitive self-check to prevent replying to ourselves
        if ((comment.agentName || "").toLowerCase() === selfName) continue;
        if (comment.agentId === parseInt(this.agentId)) continue;

        // STRICT: Check if already processed this comment
        const processedKey = `neptu:processed_comment:${comment.id}`;
        const alreadyProcessed = await this.cache.get(processedKey);
        if (alreadyProcessed) continue;

        const birthdayMatch = extractBirthday(comment.body);
        let response: string | null;

        if (birthdayMatch) {
          const reading = this.generatePeluangReading(birthdayMatch);
          response = createBirthdayReply(
            comment.agentName,
            reading,
            comment.id,
          );
        } else {
          response = generateSmartEngagement(comment.agentName, comment.body);
          if (!response) {
            await this.markProcessed(processedKey);
            continue;
          }
        }

        try {
          await this.client.createComment(post.id, response);
          await this.markProcessed(processedKey);
          // Also mark post-level to prevent other tasks from commenting
          await this.cache.put(postCommentKey, new Date().toISOString(), {
            expirationTtl: CACHE_TTL_FOREVER,
          });
          processed++;
          await this.delay(COMMENT_RATE_LIMIT_MS);
        } catch {
          // Rate limited - stop
          break;
        }
      }
    }

    return processed;
  }

  /**
   * Engage with forum - MAXIMIZE upvotes within limits.
   * NO comments here - handled by commentOnAgentPosts to prevent duplicates.
   */
  async engageWithForum(): Promise<{ upvoted: number; commented: number }> {
    let upvoted = 0;
    const commented = 0; // Disabled - use commentOnAgentPosts only

    // Get more posts for voting
    const { posts } = await this.client.listPosts({ sort: "hot", limit: 60 });

    for (const post of posts) {
      if (post.agentName === this.agentName) continue;
      if (upvoted >= MAX_FORUM_VOTES_PER_HEARTBEAT) break;

      const engagedKey = `neptu:voted_post:${post.id}`;
      const alreadyVoted = await this.cache.get(engagedKey);
      if (alreadyVoted) continue;

      // Vote on ALL posts aggressively to maximize engagement
      try {
        await this.client.votePost(post.id, 1);
        await this.cache.put(engagedKey, "true", {
          expirationTtl: CACHE_TTL_FOREVER,
        });
        upvoted++;
      } catch {
        // Already voted or rate limited
      }

      await this.delay(400); // Fast for votes
    }

    return { upvoted, commented };
  }

  /**
   * Generate a smart comment for a post using the comment generator.
   */
  async generateSmartComment(post: ForumPost): Promise<string | null> {
    return generatePromoComment(post);
  }

  /**
   * Comment on other agents' posts with UNIQUE, RELEVANT comments.
   * STRICT RULES:
   * 1. NEVER comment twice on same thread - checked via persistent cache
   * 2. NEVER post similar/same comments - each is unique based on post content
   * 3. Only comment if genuinely relevant - skip if no connection found
   * 4. Maximize within limits - reach ~24 comments/hour
   */
  async commentOnAgentPosts(): Promise<number> {
    let commented = 0;

    // Get more posts to have options
    const { posts } = await this.client.listPosts({ sort: "new", limit: 60 });

    for (const post of posts) {
      // Skip own posts (case-insensitive + ID check)
      if ((post.agentName || "").toLowerCase() === this.agentName.toLowerCase())
        continue;
      if (post.agentId === parseInt(this.agentId)) continue;

      // Respect rate limit
      if (commented >= MAX_COMMENTS_PER_HEARTBEAT) break;

      // STRICT: Check if EVER commented on this post (1 year cache = forever)
      const commentKey = `neptu:commented_post:${post.id}`;
      const alreadyCommented = await this.cache.get(commentKey);
      if (alreadyCommented) continue;

      // Generate UNIQUE and RELEVANT comment based on actual post content
      // Returns null if no relevant connection found
      const comment = generatePromoComment(post);
      if (!comment) continue;

      try {
        await this.client.createComment(post.id, comment);

        // Mark as commented FOREVER (1 year TTL)
        await this.cache.put(commentKey, new Date().toISOString(), {
          expirationTtl: CACHE_TTL_FOREVER,
        });

        commented++;
        console.log(
          `Commented on post ${post.id}: "${post.title.slice(0, 50)}..."`,
        );

        await this.delay(COMMENT_RATE_LIMIT_MS);
      } catch (e) {
        // Rate limited or error - stop to avoid spam
        console.error(`Failed to comment on post ${post.id}:`, e);
        break;
      }
    }

    return commented;
  }

  /**
   * Search for and respond to mentions or relevant discussions.
   */
  async respondToMentions(): Promise<number> {
    let responses = 0;
    const queries = ["neptu", "balinese", "wuku", "astrology", "calendar"];

    for (const query of queries) {
      try {
        const { results } = await this.client.searchForum(query, { limit: 10 });
        responses += await this.processSearchResults(results);
      } catch {
        // Search might fail - continue
      }
    }

    return responses;
  }

  /**
   * Get current engagement stats.
   */
  async getStats(): Promise<{
    status: AgentStatus;
    myPosts: number;
    myComments: number;
  }> {
    const status = await this.client.getStatus();
    const { posts } = await this.client.getMyPosts({ limit: 100 });
    const { comments } = await this.client.getMyComments({ limit: 100 });

    return {
      status,
      myPosts: posts.length,
      myComments: comments.length,
    };
  }

  // --- Private helper methods ---

  /**
   * Run intelligent voting on forum posts
   */
  async runIntelligentVoting(): Promise<VoteResult> {
    return runIntelligentVoting(this.client, this.cache, this.agentName);
  }

  /**
   * Vote strategically on other teams' projects
   * Builds relationships and goodwill
   */
  async voteOnProjectsStrategically(): Promise<ProjectVoteResult> {
    // Get our team ID to avoid voting on own project
    let myTeamId: number | null = null;
    try {
      const team = await this.client.getMyTeam();
      myTeamId = team.team.id;
    } catch {
      // May not have a team yet
    }

    // Cache our project ID for future reference
    try {
      const { project } = await this.client.getMyProject();
      await this.cache.put("neptu:my_project_id", project.id.toString(), {
        expirationTtl: 86400,
      });
    } catch {
      // May not have a project yet
    }

    return voteOnProjectsStrategically(this.client, this.cache, myTeamId);
  }

  /** Calculate vote score for a post */
  getVoteScore(post: ForumPost): number {
    return calculateVoteScore(post);
  }

  /** Orchestrate strategic posting based on hackathon timeline */
  async orchestratePosting(): Promise<OrchestrateResult> {
    return orchestratePosting(
      this.client,
      this.calculator,
      this.cache,
      this.agentName,
      this.db,
    );
  }

  /** Check if it's a good time to post */
  async shouldPostNow(): Promise<{ should: boolean; reason: string }> {
    return shouldPostNow(this.cache);
  }

  /**
   * Run the Agent Cosmic Profile campaign.
   * Fetches ALL agents, generates personalized Balinese readings,
   * and posts batches of 50 agents per post with @mentions.
   * Designed to run across multiple heartbeat cycles until complete.
   */
  async runCosmicProfileCampaign(): Promise<CampaignResult> {
    return runCosmicProfileCampaign(
      this.client,
      this.calculator,
      this.cache,
      this.agentName,
    );
  }

  /** Check cosmic campaign progress */
  async getCosmicCampaignProgress(): Promise<{
    isComplete: boolean;
    batchesPosted: number;
    agentsCached: number;
  }> {
    return getCampaignProgress(this.cache);
  }

  /**
   * Run the Final Day Cosmic Forecast campaign.
   * Posts batched forecasts comparing today vs deadline energy.
   */
  async runFinalDayForecast(): Promise<FinalForecastResult> {
    return runFinalDayForecast(
      this.client,
      this.calculator,
      this.cache,
      this.agentName,
    );
  }

  /** Check final forecast progress */
  async getFinalForecastProgress(): Promise<{
    isComplete: boolean;
    batchesPosted: number;
  }> {
    return getFinalForecastProgress(this.cache);
  }

  /** Track engagement for an action */
  async trackEngagement(
    action: string,
    success: boolean,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    return trackEngagement(this.cache, action, success, metadata);
  }

  /** Get analytics summary */
  async getAnalytics(): Promise<AnalyticsData> {
    return getAnalytics(this.cache);
  }

  /** Check if we've hit engagement limit for an agent */
  async canEngageAgent(
    agentId: string,
  ): Promise<{ allowed: boolean; currentCount: number }> {
    return checkAgentEngagementLimit(this.cache, agentId);
  }

  /** Record engagement with an agent */
  async recordAgentEngagement(agentId: string): Promise<void> {
    return incrementAgentEngagement(this.cache, agentId);
  }

  // --- Private helper methods below ---

  private async markProcessed(key: string): Promise<void> {
    await this.cache.put(key, new Date().toISOString(), {
      expirationTtl: CACHE_TTL_FOREVER,
    });
  }

  private async processSearchResults(
    results: Array<{ type: string } & Partial<ForumPost>>,
  ): Promise<number> {
    let responses = 0;
    const selfName = this.agentName.toLowerCase();
    const selfId = parseInt(this.agentId);

    for (const result of results) {
      if (result.type !== "post") continue;
      const post = result as ForumPost & { type: "post"; postId: number };
      if ((post.agentName || "").toLowerCase() === selfName) continue;
      if (post.agentId === selfId) continue;

      const commentKey = `neptu:commented_post:${post.id}`;
      if (await this.cache.get(commentKey)) continue;

      const response = createMentionResponse(post);
      try {
        await this.client.createComment(post.id, response);
        await this.cache.put(commentKey, new Date().toISOString(), {
          expirationTtl: CACHE_TTL_FOREVER,
        });
        responses++;
        await this.delay(COMMENT_RATE_LIMIT_MS);
      } catch {
        break;
      }
    }
    return responses;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
