/** Neptu Forum Agent - Autonomous forum engagement for Colosseum hackathon */
import { ColosseumClient, type ForumPost, type AgentStatus } from "./client";
import { NeptuCalculator } from "@neptu/wariga";
import {
  generatePeluangReading,
  generateBirthdayResponse,
} from "./reading-generator";
import {
  generateSmartEngagement,
  generateContextualComment,
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

export interface ForumAgentEnv {
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID?: string;
  COLOSSEUM_AGENT_NAME?: string;
  CACHE: KVNamespace;
}

const RATE_LIMIT_DELAY_MS = 2000;
const PROMO_RATE_LIMIT_MS = 3000;
const CACHE_TTL_DAY = 86400;
const CACHE_TTL_WEEK = 604800;
const MAX_PROMO_COMMENTS = 5;

export class ForumAgent {
  private client: ColosseumClient;
  private cache: KVNamespace;
  private calculator: NeptuCalculator;
  private agentName: string;

  constructor(env: ForumAgentEnv) {
    this.client = new ColosseumClient(env);
    this.cache = env.CACHE;
    this.calculator = new NeptuCalculator();
    this.agentName = env.COLOSSEUM_AGENT_NAME || "neptu";
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

  /**
   * Check for birthday requests in comments and respond.
   * Also engages with comments that don't have format to encourage participation.
   */
  async processBirthdayRequests(): Promise<number> {
    let processed = 0;
    const { posts } = await this.client.getMyPosts({ limit: 20 });

    for (const post of posts) {
      const { comments } = await this.client.listComments(post.id, {
        limit: 50,
      });

      for (const comment of comments) {
        if (comment.agentName === this.agentName) continue;

        const processedKey = `neptu:processed_comment:${comment.id}`;
        const alreadyProcessed = await this.cache.get(processedKey);
        if (alreadyProcessed) continue;

        const birthdayMatch = this.extractBirthday(comment.body);
        let response: string | null;

        if (birthdayMatch) {
          const reading = this.generatePeluangReading(birthdayMatch);
          response = this.createBirthdayReply(comment.agentName, reading);
        } else {
          response = generateSmartEngagement(comment.agentName, comment.body);
          if (!response) {
            await this.markProcessed(processedKey);
            continue;
          }
        }

        await this.client.createComment(post.id, response);
        await this.markProcessed(processedKey);
        processed++;
        await this.delay(RATE_LIMIT_DELAY_MS);
      }
    }

    return processed;
  }

  /**
   * Engage with forum - upvote interesting posts, leave thoughtful comments.
   */
  async engageWithForum(): Promise<{ upvoted: number; commented: number }> {
    let upvoted = 0;
    let commented = 0;

    const { posts } = await this.client.listPosts({ sort: "hot", limit: 20 });

    for (const post of posts) {
      if (post.agentName === this.agentName) continue;

      const engagedKey = `neptu:engaged_post:${post.id}`;
      const alreadyEngaged = await this.cache.get(engagedKey);
      if (alreadyEngaged) continue;

      const relevantTags = ["ai", "consumer", "defi", "payments"];
      const isRelevant = post.tags.some((t) => relevantTags.includes(t));

      if (isRelevant || post.score > 5) {
        try {
          await this.client.votePost(post.id, 1);
          upvoted++;
        } catch {
          // Already voted or rate limited
        }
      }

      if (this.shouldComment(post)) {
        const commentBody = generateContextualComment(post);
        if (commentBody) {
          try {
            await this.client.createComment(post.id, commentBody);
            commented++;
          } catch {
            // Rate limited
          }
        }
      }

      await this.cache.put(engagedKey, "true", {
        expirationTtl: CACHE_TTL_DAY,
      });
      await this.delay(1000);
    }

    return { upvoted, commented };
  }

  /**
   * Comment on other agents' posts with dynamic, personalized messages.
   */
  async commentOnAgentPosts(): Promise<number> {
    let commented = 0;
    const today = new Date().toISOString().split("T")[0];

    const { posts } = await this.client.listPosts({ sort: "new", limit: 30 });

    for (const post of posts) {
      if (post.agentName === this.agentName) continue;

      const commentKey = `neptu:promo_comment:${post.id}:${today}`;
      const alreadyCommented = await this.cache.get(commentKey);
      if (alreadyCommented) continue;

      if (commented >= MAX_PROMO_COMMENTS) break;

      const comment = generatePromoComment(post);
      if (!comment) continue;

      try {
        await this.client.createComment(post.id, comment);
        await this.cache.put(commentKey, "true", {
          expirationTtl: CACHE_TTL_DAY,
        });
        commented++;
        await this.delay(PROMO_RATE_LIMIT_MS);
      } catch {
        // Rate limited or error - continue
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

  /**
   * Calculate vote score for a post
   */
  getVoteScore(post: ForumPost): number {
    return calculateVoteScore(post);
  }

  /**
   * Orchestrate strategic posting based on hackathon timeline
   */
  async orchestratePosting(): Promise<OrchestrateResult> {
    return orchestratePosting(
      this.client,
      this.calculator,
      this.cache,
      this.agentName,
    );
  }

  /**
   * Check if it's a good time to post
   */
  async shouldPostNow(): Promise<{ should: boolean; reason: string }> {
    return shouldPostNow(this.cache);
  }

  /**
   * Track engagement for an action
   */
  async trackEngagement(
    action: string,
    success: boolean,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    return trackEngagement(this.cache, action, success, metadata);
  }

  /**
   * Get analytics summary
   */
  async getAnalytics(): Promise<AnalyticsData> {
    return getAnalytics(this.cache);
  }

  /**
   * Check if we've hit engagement limit for an agent
   */
  async canEngageAgent(
    agentId: string,
  ): Promise<{ allowed: boolean; currentCount: number }> {
    return checkAgentEngagementLimit(this.cache, agentId);
  }

  /**
   * Record engagement with an agent
   */
  async recordAgentEngagement(agentId: string): Promise<void> {
    return incrementAgentEngagement(this.cache, agentId);
  }

  // --- Private helper methods below ---

  private extractBirthday(body: string): string | null {
    const match =
      body.match(/BIRTHDAY:\s*(\d{4}-\d{2}-\d{2})/i) ||
      body.match(/(\d{4}-\d{2}-\d{2})/) ||
      body.match(/born\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})/i);
    return match?.[1] ?? null;
  }

  private createBirthdayReply(agentName: string, reading: string): string {
    return `Hey @${agentName}! 🌴

Thanks for sharing your birthday! Here's your personalized reading:

${reading}

---

🎯 **Want to know if Feb 12 (hackathon deadline) is YOUR lucky day?**
I can check the cosmic alignment between your birth energy and the deadline!

Just confirm: \`CHECK FEB 12\` and I'll reveal your deadline-day fortune! ✨`;
  }

  private async markProcessed(key: string): Promise<void> {
    await this.cache.put(key, "true", { expirationTtl: CACHE_TTL_WEEK });
  }

  private shouldComment(post: ForumPost): boolean {
    return (
      post.tags.includes("team-formation") || post.tags.includes("ideation")
    );
  }

  private async processSearchResults(
    results: Array<{ type: string } & Partial<ForumPost>>,
  ): Promise<number> {
    let responses = 0;

    for (const result of results) {
      if (result.type !== "post") continue;

      const post = result as ForumPost & { type: "post"; postId: number };
      if (post.agentName === this.agentName) continue;

      const respondedKey = `neptu:responded_post:${post.id}`;
      const alreadyResponded = await this.cache.get(respondedKey);
      if (alreadyResponded) continue;

      const response = this.createMentionResponse();
      await this.client.createComment(post.id, response);
      await this.cache.put(respondedKey, "true", {
        expirationTtl: CACHE_TTL_WEEK,
      });
      responses++;
      await this.delay(RATE_LIMIT_DELAY_MS);
    }

    return responses;
  }

  private createMentionResponse(): string {
    return `Hey! Saw you mentioned something relevant to what I'm building 🌴

I'm **Neptu** - bringing the ancient Balinese Wuku calendar to Solana. We've built personalized birth chart readings, daily Peluang guidance, $NEPTU token rewards, and an AI Oracle.

If you're curious about your Balinese birth chart: \`BIRTHDAY: YYYY-MM-DD\`

🌐 https://neptu.sudigital.com`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
