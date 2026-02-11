/** Hot Topic Detection & Trend Response - Monitors trending topics for Neptu relevance */
import type { ForumPost, ColosseumClient } from "./client";
import {
  NEPTU_KEYWORDS,
  findNeptuAngle,
  getTrendTemplate,
  generateTrendAwareComment,
} from "./trend-templates";

export { generateTrendAwareComment };

const CACHE_TTL_TREND = 172800; // 48 hours
const MIN_HOURS_BETWEEN_TREND_POSTS = 8;

export interface HotTopicResult {
  topics: string[];
  posts: ForumPost[];
  opportunity: string | null;
  topicCounts: Record<string, number>;
}

/** Detect hot topics from recent forum posts */
export async function detectHotTopics(
  client: ColosseumClient,
): Promise<HotTopicResult> {
  const { posts } = await client.listPosts({ sort: "hot", limit: 50 });

  const topicCounts = new Map<string, number>();
  const keywordPosts = new Map<string, ForumPost[]>();

  for (const post of posts) {
    const text = `${post.title} ${post.body}`.toLowerCase();

    for (const keyword of NEPTU_KEYWORDS) {
      if (text.includes(keyword)) {
        topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);

        if (!keywordPosts.has(keyword)) {
          keywordPosts.set(keyword, []);
        }
        keywordPosts.get(keyword)!.push(post);
      }
    }
  }

  // Find top 3 trending topics
  const trending = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);

  // Find Neptu angle for top trending topic
  const opportunity = findNeptuAngle(trending);

  // Get posts related to trending topics
  const trendingPosts = posts
    .filter((p) => {
      const text = `${p.title} ${p.body}`.toLowerCase();
      return trending.some((topic) => text.includes(topic));
    })
    .slice(0, 10);

  return {
    topics: trending,
    posts: trendingPosts,
    opportunity,
    topicCounts: Object.fromEntries(topicCounts),
  };
}

/** Check if we should post a trend response */
export async function shouldPostTrendResponse(
  cache: KVNamespace,
  opportunity: string,
): Promise<boolean> {
  // Check if already posted about this trend
  const trendKey = `neptu:trend_post:${opportunity}`;
  if (await cache.get(trendKey)) {
    return false;
  }

  // Check time since last trend post
  const lastTrendPost = await cache.get("neptu:last_trend_post_time");
  if (lastTrendPost) {
    const hoursSince = (Date.now() - parseInt(lastTrendPost, 10)) / 3600000;
    if (hoursSince < MIN_HOURS_BETWEEN_TREND_POSTS) {
      return false;
    }
  }

  return true;
}

/** Post a trend-responsive thread */
export async function postTrendResponse(
  client: ColosseumClient,
  cache: KVNamespace,
  opportunity: string,
  relatedPosts: ForumPost[],
): Promise<ForumPost | null> {
  const template = getTrendTemplate(opportunity, relatedPosts.length);
  if (!template) return null;

  if (!(await shouldPostTrendResponse(cache, opportunity))) {
    return null;
  }

  const { post } = await client.createPost({
    title: template.title,
    body: template.body,
    tags: template.tags,
  });

  const trendKey = `neptu:trend_post:${opportunity}`;
  await cache.put(trendKey, post.id.toString(), {
    expirationTtl: CACHE_TTL_TREND,
  });
  await cache.put("neptu:last_trend_post_time", Date.now().toString(), {
    expirationTtl: CACHE_TTL_TREND,
  });

  return post;
}
