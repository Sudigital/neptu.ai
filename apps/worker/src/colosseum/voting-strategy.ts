/**
 * Intelligent Voting Strategy
 * Strategic voting on both PROJECTS and FORUM POSTS
 */

import type { ForumPost, ColosseumClient, Project } from "./client";

// Thresholds for vote scoring
const SCORE_THRESHOLD_VOTE = 1; // Very low to vote on almost everything
const AGE_HOURS_PRIORITY = 2;
const AGE_HOURS_MEDIUM = 6;
const POINTS_RECENT_POST = 4;
const POINTS_MEDIUM_AGE = 2;
const POINTS_HIGH_SCORE = 3;
const POINTS_HIGH_COMMENTS = 2;
const POINTS_RELEVANT_TAG = 3;
const POINTS_SPAM_PENALTY = -5;
const MIN_BODY_LENGTH_SPAM = 200;

const CACHE_TTL_WEEK = 604800;
const CACHE_TTL_LONG = 864000; // 10 days
const RATE_LIMIT_MS = 1000;
const MAX_PROJECT_VOTES_PER_RUN = 10; // 10 per 15min = aggressive reciprocal voting

export interface VoteResult {
  voted: number;
  skipped: number;
  reasons: Record<string, number>;
}

export interface ProjectVoteResult {
  voted: number;
  skipped: number;
  votedProjects: string[];
  reasons: Record<string, number>;
}

// =====================================================
// PROJECT VOTING - Builds relationships with teams
// =====================================================

/**
 * Evaluate if a project is worth voting for
 * Votes on quality projects to build goodwill
 */
export function evaluateProject(project: Project): {
  shouldVote: boolean;
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Must be submitted (not draft)
  if (project.status !== "submitted") {
    return { shouldVote: false, score: 0, reasons: ["draft"] };
  }

  // Has real repo (not placeholder)
  const hasRealRepo =
    project.repoLink &&
    !project.repoLink.includes("placeholder") &&
    !project.repoLink.includes("example.com") &&
    (project.repoLink.includes("github.com") ||
      project.repoLink.includes("gitlab.com"));

  if (hasRealRepo) {
    score += 3;
    reasons.push("has_repo");
  }

  // Has demo link (shows execution)
  if (project.technicalDemoLink) {
    score += 2;
    reasons.push("has_demo");
  }

  // Has presentation (effort shown)
  if (project.presentationLink) {
    score += 1;
    reasons.push("has_presentation");
  }

  // Relevant/complementary categories (potential synergies)
  const relevantTags = ["ai", "consumer", "defi", "payments", "social"];
  if (project.tags?.some((t) => relevantTags.includes(t.toLowerCase()))) {
    score += 2;
    reasons.push("relevant_category");
  }

  // Has Solana integration described
  if (project.solanaIntegration && project.solanaIntegration.length > 50) {
    score += 2;
    reasons.push("solana_integration");
  }

  // Threshold: need at least 1 point (vote on almost all projects)
  return {
    shouldVote: score >= 1,
    score,
    reasons,
  };
}

/**
 * Run strategic project voting
 * Votes on quality projects to build relationships
 */
export async function voteOnProjectsStrategically(
  client: ColosseumClient,
  cache: KVNamespace,
  _myTeamId: number | null, // Reserved for future team-based filtering
): Promise<ProjectVoteResult> {
  const result: ProjectVoteResult = {
    voted: 0,
    skipped: 0,
    votedProjects: [],
    reasons: {},
  };

  try {
    const { projects } = await client.listProjects({ includeDrafts: false });

    for (const project of projects) {
      // Stop if we've voted enough this run (pace within rate limit)
      if (result.voted >= MAX_PROJECT_VOTES_PER_RUN) {
        incrementReason(result.reasons, "max_reached");
        break;
      }

      // Skip our own project
      // Note: We can't directly compare teamId, so we check by name or cache
      const isOwnProject = await cache.get("neptu:my_project_id");
      if (isOwnProject && project.id.toString() === isOwnProject) {
        result.skipped++;
        incrementReason(result.reasons, "own_project");
        continue;
      }

      // Check if already voted
      const voteKey = `neptu:voted_project:${project.id}`;
      if (await cache.get(voteKey)) {
        result.skipped++;
        incrementReason(result.reasons, "already_voted");
        continue;
      }

      // Evaluate project quality
      const evaluation = evaluateProject(project);

      if (evaluation.shouldVote) {
        try {
          await client.voteProject(project.id);
          await cache.put(voteKey, "true", { expirationTtl: CACHE_TTL_LONG });
          result.voted++;
          result.votedProjects.push(project.name);
          await delay(RATE_LIMIT_MS);
        } catch {
          incrementReason(result.reasons, "vote_failed");
        }
      } else {
        result.skipped++;
        incrementReason(result.reasons, evaluation.reasons[0] || "low_quality");
      }
    }
  } catch {
    incrementReason(result.reasons, "list_failed");
  }

  return result;
}

// =====================================================
// FORUM POST VOTING - Engagement signals
// =====================================================

/**
 * Calculate vote worthiness score for a post
 */
export function calculateVoteScore(post: ForumPost): number {
  let score = 0;

  // Recent posts get priority (encourage early engagement)
  const ageHours = getPostAgeHours(post);
  if (ageHours < AGE_HOURS_PRIORITY) {
    score += POINTS_RECENT_POST;
  } else if (ageHours < AGE_HOURS_MEDIUM) {
    score += POINTS_MEDIUM_AGE;
  }

  // High-quality signals
  if (post.score > SCORE_THRESHOLD_VOTE) score += POINTS_HIGH_SCORE;
  if (post.commentCount > 3) score += POINTS_HIGH_COMMENTS;

  // Relevant topics
  const relevantTags = ["ai", "consumer", "ideation", "progress-update"];
  if (post.tags.some((t) => relevantTags.includes(t))) {
    score += POINTS_RELEVANT_TAG;
  }

  // Avoid spammy posts
  const body = post.body.toLowerCase();
  if (
    (body.includes("vote for me") || body.includes("just vote")) &&
    body.length < MIN_BODY_LENGTH_SPAM
  ) {
    score += POINTS_SPAM_PENALTY;
  }

  // Quality content signals
  if (body.includes("demo") || body.includes("github")) score += 2;
  if (body.length > 500) score += 1; // Substantial posts

  return score;
}

/**
 * Get post age in hours
 */
function getPostAgeHours(post: ForumPost): number {
  const createdAt = new Date(post.createdAt).getTime();
  return (Date.now() - createdAt) / 3600000;
}

/**
 * Run intelligent voting strategy
 */
export async function runIntelligentVoting(
  client: ColosseumClient,
  cache: KVNamespace,
  agentName: string,
): Promise<VoteResult> {
  const result: VoteResult = {
    voted: 0,
    skipped: 0,
    reasons: {},
  };

  const { posts } = await client.listPosts({ sort: "new", limit: 60 });

  for (const post of posts) {
    // Skip own posts
    if (post.agentName === agentName) {
      result.skipped++;
      incrementReason(result.reasons, "own_post");
      continue;
    }

    // Check if already voted
    const voteKey = `neptu:voted:${post.id}`;
    const alreadyVoted = await cache.get(voteKey);
    if (alreadyVoted) {
      result.skipped++;
      incrementReason(result.reasons, "already_voted");
      continue;
    }

    // Calculate vote worthiness
    const score = calculateVoteScore(post);

    // Vote on high-value posts
    if (score > SCORE_THRESHOLD_VOTE) {
      try {
        await client.votePost(post.id, 1);
        await cache.put(voteKey, "true", { expirationTtl: CACHE_TTL_WEEK });
        result.voted++;
        await delay(RATE_LIMIT_MS);
      } catch {
        incrementReason(result.reasons, "vote_failed");
      }
    } else {
      result.skipped++;
      incrementReason(result.reasons, "low_score");
    }
  }

  return result;
}

/**
 * Helper to increment reason counter
 */
function incrementReason(reasons: Record<string, number>, key: string): void {
  reasons[key] = (reasons[key] || 0) + 1;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
