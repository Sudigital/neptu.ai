/**
 * Trending Post Analyzer
 *
 * Analyzes the Colosseum forum's trending algorithm and post performance
 * patterns to optimize Neptu's posting strategy.
 *
 * ## How Trending Works (Colosseum Forum)
 *
 * 1. **"Trending Posts" sidebar** — Ranked by **score delta** (score change
 *    over a recent time window, likely 6-12h). Higher delta = trending.
 *
 * 2. **`sort=hot`** — Reddit-style decay: `score / (age_hours + 2)^gravity`.
 *    Newer posts with moderate score beat older posts with high score.
 *
 * 3. **`sort=top`** — Raw score (upvotes − downvotes), all-time.
 *
 * ## What Drives Trending
 *
 * From data analysis of top-performing posts:
 *   - **Engagement velocity**: Comments in first 1-2h boost hot ranking
 *   - **Interactive content**: Questions, quizzes, challenges → 2-3x comments
 *   - **Agent-tagging**: Referencing specific agents → reciprocal engagement
 *   - **Value exchange**: Offering upvotes/integration in return → high delta
 *   - **Data-backed updates**: Real metrics + progress → credibility + votes
 *   - **Partnership calls**: Integration requests → drives both comments + votes
 *
 * ## Anti-Patterns (What Fails)
 *   - Monologue-style posts with no questions
 *   - Repetitive self-promotion without new value
 *   - Generic templates without post-specific content
 *   - Posting during low-activity hours (0-8 UTC)
 */

import type { ForumPost, ColosseumClient } from "./client";

// ─── Types ───

export interface PostMetrics {
  id: number;
  title: string;
  agentName: string;
  score: number;
  commentCount: number;
  ageHours: number;
  /** Engagement velocity: comments per hour */
  commentsPerHour: number;
  /** Score velocity: score per hour */
  scorePerHour: number;
  /** Hot score estimate (Reddit-style) */
  hotScore: number;
  tags: string[];
  /** Detected post type pattern */
  postType: PostType;
}

export type PostType =
  | "challenge"
  | "quiz_poll"
  | "partnership"
  | "vote_exchange"
  | "progress_update"
  | "infrastructure"
  | "analysis"
  | "integration_call"
  | "generic";

export interface TrendingInsight {
  /** Posts currently gaining score fastest */
  fastestRising: PostMetrics[];
  /** Most effective post types right now */
  topPostTypes: { type: PostType; avgScore: number; count: number }[];
  /** Optimal posting window based on trending activity */
  activeHours: number[];
  /** Agents with most trending posts (potential engagement targets) */
  trendingAgents: { name: string; trendingPosts: number; totalScore: number }[];
  /** Our own post performance vs average */
  neptuPerformance: {
    avgScore: number;
    avgComments: number;
    forumAvgScore: number;
    forumAvgComments: number;
    percentileScore: number;
  } | null;
  /** Recommended post type to use next */
  recommendedPostType: PostType;
  /** Recommended agents to engage with */
  recommendedEngagements: string[];
}

// ─── Constants ───

const HOT_GRAVITY = 1.8;
const HOT_EPOCH_OFFSET = 2; // hours offset

// ─── Post Type Detection ───

const POST_TYPE_PATTERNS: { type: PostType; patterns: RegExp[] }[] = [
  {
    type: "challenge",
    patterns: [
      /honest\s+critique/i,
      /pressure.?test/i,
      /disagree.*tell\s+me/i,
      /prove\s+me\s+wrong/i,
      /hot\s+take/i,
      /unpopular\s+opinion/i,
      /moat\s+test/i,
    ],
  },
  {
    type: "quiz_poll",
    patterns: [
      /quiz/i,
      /poll/i,
      /\b[A-D]\)/,
      /vote\s+below/i,
      /which\s+one/i,
      /choose/i,
      /what('s| is)\s+your\s+(biggest|#1|top)/i,
    ],
  },
  {
    type: "vote_exchange",
    patterns: [
      /vote\s+swap/i,
      /vote\s+alliance/i,
      /help\s+each\s+other/i,
      /mutual\s+vote/i,
      /i'll\s+vote\s+for\s+you/i,
      /upvote.*return/i,
    ],
  },
  {
    type: "partnership",
    patterns: [
      /looking\s+for\s+(integration|partner)/i,
      /let('s| us)\s+(integrate|partner|collaborate)/i,
      /who\s+wants\s+to\s+(integrate|partner)/i,
      /open\s+for\s+integrations/i,
      /integration\s+partners/i,
    ],
  },
  {
    type: "integration_call",
    patterns: [
      /\bCPI\b/i,
      /composable/i,
      /shared\s+infra/i,
      /sdk\s+ready/i,
      /api\s+(ready|live|open)/i,
      /plug\s+in/i,
    ],
  },
  {
    type: "progress_update",
    patterns: [
      /day\s+\d+/i,
      /progress\s+update/i,
      /what\s+we('ve| have)\s+built/i,
      /milestone/i,
      /shipped/i,
      /final\s+push/i,
      /submitted/i,
    ],
  },
  {
    type: "analysis",
    patterns: [
      /deep\s+dive/i,
      /analysis/i,
      /data-driven/i,
      /the\s+pattern/i,
      /what\s+the\s+data\s+shows/i,
      /benchmark/i,
      /\d+\+?\s+(trades|transactions|users)/i,
    ],
  },
];

/** Detect the dominant post type from title + body */
export function detectPostType(title: string, body: string): PostType {
  const text = `${title} ${body}`;
  let bestType: PostType = "generic";
  let bestMatches = 0;

  for (const { type, patterns } of POST_TYPE_PATTERNS) {
    const matches = patterns.filter((p) => p.test(text)).length;
    if (matches > bestMatches) {
      bestMatches = matches;
      bestType = type;
    }
  }

  return bestType;
}

// ─── Metrics Calculation ───

function calculateHotScore(score: number, ageHours: number): number {
  const logScore = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  return sign * logScore - Math.log10(ageHours + HOT_EPOCH_OFFSET) * HOT_GRAVITY;
}

function getAgeHours(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  return Math.max(0.1, (Date.now() - created) / 3600000);
}

export function calculatePostMetrics(post: ForumPost): PostMetrics {
  const ageHours = getAgeHours(post.createdAt);
  return {
    id: post.id,
    title: post.title,
    agentName: post.agentName,
    score: post.score,
    commentCount: post.commentCount,
    ageHours,
    commentsPerHour: post.commentCount / ageHours,
    scorePerHour: post.score / ageHours,
    hotScore: calculateHotScore(post.score, ageHours),
    tags: post.tags || [],
    postType: detectPostType(post.title, post.body),
  };
}

// ─── Trending Analysis ───

/**
 * Analyze forum to generate actionable trending insights.
 * Fetches hot + new posts, calculates metrics, identifies patterns.
 */
export async function analyzeTrending(
  client: ColosseumClient,
  agentName: string,
): Promise<TrendingInsight> {
  // Fetch hot and new posts in parallel
  const [hotResult, newResult] = await Promise.all([
    client.listPosts({ sort: "hot", limit: 50 }),
    client.listPosts({ sort: "new", limit: 50 }),
  ]);

  // Deduplicate by post ID
  const allPostsMap = new Map<number, ForumPost>();
  for (const p of [...hotResult.posts, ...newResult.posts]) {
    allPostsMap.set(p.id, p);
  }
  const allPosts = Array.from(allPostsMap.values());

  // Calculate metrics for all posts
  const metrics = allPosts.map(calculatePostMetrics);

  // 1. Fastest rising posts (highest score velocity, min 1h old)
  const fastestRising = metrics
    .filter((m) => m.ageHours >= 1 && m.ageHours <= 24)
    .sort((a, b) => b.scorePerHour - a.scorePerHour)
    .slice(0, 10);

  // 2. Top post types by average score
  const typeMap = new Map<PostType, { scores: number[]; count: number }>();
  for (const m of metrics) {
    const entry = typeMap.get(m.postType) || { scores: [], count: 0 };
    entry.scores.push(m.score);
    entry.count++;
    typeMap.set(m.postType, entry);
  }
  const topPostTypes = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // 3. Active hours (when trending posts are created)
  const hourCounts = new Map<number, number>();
  for (const m of fastestRising) {
    const hour = new Date(
      Date.now() - m.ageHours * 3600000,
    ).getUTCHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const activeHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([hour]) => hour);

  // 4. Trending agents
  const agentMap = new Map<
    string,
    { trendingPosts: number; totalScore: number }
  >();
  for (const m of fastestRising) {
    const entry = agentMap.get(m.agentName) || {
      trendingPosts: 0,
      totalScore: 0,
    };
    entry.trendingPosts++;
    entry.totalScore += m.score;
    agentMap.set(m.agentName, entry);
  }
  const trendingAgents = Array.from(agentMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);

  // 5. Neptu performance vs average
  const neptuPosts = metrics.filter(
    (m) => m.agentName.toLowerCase() === agentName.toLowerCase(),
  );
  const forumAvgScore =
    metrics.length > 0
      ? metrics.reduce((a, b) => a + b.score, 0) / metrics.length
      : 0;
  const forumAvgComments =
    metrics.length > 0
      ? metrics.reduce((a, b) => a + b.commentCount, 0) / metrics.length
      : 0;

  let neptuPerformance: TrendingInsight["neptuPerformance"] = null;
  if (neptuPosts.length > 0) {
    const avgScore =
      neptuPosts.reduce((a, b) => a + b.score, 0) / neptuPosts.length;
    const avgComments =
      neptuPosts.reduce((a, b) => a + b.commentCount, 0) / neptuPosts.length;
    // Calculate percentile (what % of posts we beat)
    const allScores = metrics.map((m) => m.score).sort((a, b) => a - b);
    const neptuMedianScore =
      neptuPosts.reduce((a, b) => a + b.score, 0) / neptuPosts.length;
    const beatCount = allScores.filter((s) => s <= neptuMedianScore).length;
    const percentileScore = (beatCount / allScores.length) * 100;

    neptuPerformance = {
      avgScore,
      avgComments,
      forumAvgScore,
      forumAvgComments,
      percentileScore,
    };
  }

  // 6. Recommended post type (highest avg score type we haven't posted recently)
  const neptuPostTypes = new Set(neptuPosts.map((p) => p.postType));
  const recommendedPostType =
    topPostTypes.find((t) => !neptuPostTypes.has(t.type) && t.count >= 2)
      ?.type || topPostTypes[0]?.type || "progress_update";

  // 7. Recommended agents to engage with
  const recommendedEngagements = trendingAgents
    .filter((a) => a.name.toLowerCase() !== agentName.toLowerCase())
    .slice(0, 5)
    .map((a) => a.name);

  return {
    fastestRising,
    topPostTypes,
    activeHours,
    trendingAgents,
    neptuPerformance,
    recommendedPostType,
    recommendedEngagements,
  };
}

/**
 * Track our post's score over time to calculate delta.
 * Store in KV: `neptu:post_score:{postId}:{timestamp}` → score
 */
export async function trackPostScore(
  cache: KVNamespace,
  postId: number,
  score: number,
  commentCount: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 3600000); // hour bucket
  const key = `neptu:post_score:${postId}:${now}`;
  await cache.put(
    key,
    JSON.stringify({ score, commentCount, ts: Date.now() }),
    { expirationTtl: 172800 }, // 48 hours
  );
}

/**
 * Calculate score delta for our posts (score gained in last N hours).
 */
export async function getScoreDelta(
  cache: KVNamespace,
  postId: number,
  hoursAgo: number = 6,
): Promise<{ scoreDelta: number; commentDelta: number }> {
  const now = Math.floor(Date.now() / 3600000);
  const then = now - hoursAgo;

  const [currentRaw, pastRaw] = await Promise.all([
    cache.get(`neptu:post_score:${postId}:${now}`),
    cache.get(`neptu:post_score:${postId}:${then}`),
  ]);

  const current = currentRaw
    ? (JSON.parse(currentRaw) as { score: number; commentCount: number })
    : null;
  const past = pastRaw
    ? (JSON.parse(pastRaw) as { score: number; commentCount: number })
    : null;

  if (!current || !past) {
    return { scoreDelta: 0, commentDelta: 0 };
  }

  return {
    scoreDelta: current.score - past.score,
    commentDelta: current.commentCount - past.commentCount,
  };
}

/**
 * Identify which trending posts we should comment on for maximum visibility.
 * Prioritizes: high velocity + not yet commented + relevant topic.
 */
export function findHighValueCommentTargets(
  metrics: PostMetrics[],
  agentName: string,
): PostMetrics[] {
  return metrics
    .filter((m) => {
      // Skip own posts
      if (m.agentName.toLowerCase() === agentName.toLowerCase()) return false;
      // Prefer posts 1-6h old (still in hot window)
      if (m.ageHours > 6 || m.ageHours < 0.3) return false;
      // Must have some engagement velocity
      if (m.commentsPerHour < 1) return false;
      return true;
    })
    .sort((a, b) => b.scorePerHour - a.scorePerHour)
    .slice(0, 5);
}
