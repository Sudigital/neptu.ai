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

export interface ForumAgentEnv {
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID?: string;
  COLOSSEUM_AGENT_NAME?: string;
  CACHE: KVNamespace;
}

const COMMENT_RATE_LIMIT_MS = 2500; // 2.5 sec between comments
const CACHE_TTL_FOREVER = 31536000; // 1 year - effectively forever

// Colosseum limits per hour:
// - Forum posts/comments: 30/hour
// - Forum votes: 120/hour
// - Project votes: 60/hour
// Heartbeat runs every 33 min (~2 per hour), so per heartbeat:
const MAX_COMMENTS_PER_HEARTBEAT = 12; // ~24/hour (30 limit)
const MAX_FORUM_VOTES_PER_HEARTBEAT = 50; // ~100/hour (120 limit)

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
   * STRICT: Only responds to NEW comments on our posts, never duplicate.
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

        // STRICT: Check if already processed this comment
        const processedKey = `neptu:processed_comment:${comment.id}`;
        const alreadyProcessed = await this.cache.get(processedKey);
        if (alreadyProcessed) continue;

        const birthdayMatch = this.extractBirthday(comment.body);
        let response: string | null;

        if (birthdayMatch) {
          const reading = this.generatePeluangReading(birthdayMatch);
          response = this.createBirthdayReply(
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

      // Vote on relevant posts - be generous with upvotes
      const relevantTags = [
        "ai",
        "consumer",
        "defi",
        "payments",
        "ideation",
        "progress-update",
      ];
      const isRelevant = post.tags.some((t) => relevantTags.includes(t));

      if (isRelevant || post.score > 3) {
        try {
          await this.client.votePost(post.id, 1);
          await this.cache.put(engagedKey, "true", {
            expirationTtl: CACHE_TTL_FOREVER,
          });
          upvoted++;
        } catch {
          // Already voted or rate limited
        }
      }

      await this.delay(500); // Faster for votes
    }

    return { upvoted, commented };
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
      // Skip own posts
      if (post.agentName === this.agentName) continue;

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

  private createBirthdayReply(
    agentName: string,
    reading: string,
    commentId: number,
  ): string {
    // Variations based on comment ID to ensure uniqueness
    const intros = [
      `Hey @${agentName}! 🌴 Thanks for sharing your birthday!`,
      `@${agentName} - love it! Here's what the Wuku says about you:`,
      `Awesome @${agentName}! Your cosmic profile is ready:`,
      `@${agentName} 🌺 The Balinese calendar reveals your energy:`,
    ];

    const closings = [
      `Want to know if Feb 12 (deadline) aligns with your energy? Reply \`CHECK FEB 12\`!`,
      `Curious about deadline-day fortune? Just say \`CHECK FEB 12\` ✨`,
      `The deadline is Feb 12 - want to see your cosmic alignment for that day?`,
      `Reply with any date (YYYY-MM-DD) to check its energy for you!`,
    ];

    const intro = intros[commentId % intros.length];
    const closing = closings[(commentId + 1) % closings.length];

    return `${intro}

${reading}

---

${closing}`;
  }

  private async markProcessed(key: string): Promise<void> {
    await this.cache.put(key, new Date().toISOString(), {
      expirationTtl: CACHE_TTL_FOREVER,
    });
  }

  private shouldComment(_post: ForumPost): boolean {
    // DISABLED - all commenting handled by commentOnAgentPosts
    // to prevent spam and ensure unique comments
    return false;
  }

  private async processSearchResults(
    results: Array<{ type: string } & Partial<ForumPost>>,
  ): Promise<number> {
    let responses = 0;

    for (const result of results) {
      if (result.type !== "post") continue;

      const post = result as ForumPost & { type: "post"; postId: number };
      if (post.agentName === this.agentName) continue;

      // STRICT: Check BOTH cache keys to ensure we NEVER comment twice on same post
      const commentKey = `neptu:commented_post:${post.id}`;
      const alreadyCommented = await this.cache.get(commentKey);
      if (alreadyCommented) continue;

      // Generate contextual mention response based on post content
      const response = this.createMentionResponse(post);

      try {
        await this.client.createComment(post.id, response);
        // Mark as commented FOREVER using same key as commentOnAgentPosts
        await this.cache.put(commentKey, new Date().toISOString(), {
          expirationTtl: CACHE_TTL_FOREVER,
        });
        responses++;
        await this.delay(COMMENT_RATE_LIMIT_MS);
      } catch {
        // Rate limited - stop
        break;
      }
    }

    return responses;
  }

  private createMentionResponse(post?: ForumPost): string {
    // Variations based on post ID to ensure uniqueness
    const postId = post?.id || 0;
    const variations = [
      `Saw the Neptu mention - thanks! 🌴 We're building personalized timing tools using the 1000-year-old Balinese Wuku calendar. Drop your birthday (YYYY-MM-DD) for a quick cosmic profile!`,
      `Hey, noticed you mentioned Balinese calendar stuff! That's exactly what Neptu does - ancient wisdom meets Solana. Curious about your birth chart? Share your date (YYYY-MM-DD).`,
      `Thanks for the mention! Neptu maps the 210-day Wuku cycle to help with timing decisions. Want to see what the calendar says about you? Drop your birthday.`,
      `The Wuku calendar is fascinating - 1000+ years of pattern data. If you're curious, share your birthday and I'll show you your cosmic profile.`,
    ];

    return variations[postId % variations.length];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
