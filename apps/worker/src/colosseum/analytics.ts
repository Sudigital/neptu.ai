/**
 * Analytics Tracking
 * Track engagement metrics to optimize agent behavior
 */

const CACHE_TTL_WEEK = 604800;

export interface AnalyticsData {
  [action: string]: {
    success: number;
    fail: number;
    total: number;
  };
}

export interface DailyStats {
  date: string;
  votes: { given: number; received: number };
  comments: { posted: number; received: number };
  posts: { created: number };
  birthdays: { processed: number };
  engagement: { total: number };
}

/**
 * Track an engagement action
 */
export async function trackEngagement(
  cache: KVNamespace,
  action: string,
  success: boolean,
  _metadata?: Record<string, unknown>,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const key = `neptu:analytics:${today}`;

  const raw = await cache.get(key);
  const data: AnalyticsData = raw ? JSON.parse(raw) : {};

  if (!data[action]) {
    data[action] = { success: 0, fail: 0, total: 0 };
  }

  if (success) {
    data[action].success++;
  } else {
    data[action].fail++;
  }
  data[action].total++;

  // Store daily summary only (skip per-call metadata to conserve KV writes)
  try {
    await cache.put(key, JSON.stringify(data), {
      expirationTtl: CACHE_TTL_WEEK,
    });
  } catch {
    console.warn(`KV write failed for analytics ${key}`);
  }
}

/**
 * Get today's analytics
 */
export async function getAnalytics(cache: KVNamespace): Promise<AnalyticsData> {
  const today = new Date().toISOString().split("T")[0];
  const key = `neptu:analytics:${today}`;
  const raw = await cache.get(key);
  return raw ? JSON.parse(raw) : {};
}

/**
 * Get analytics for a specific date
 */
export async function getAnalyticsForDate(
  cache: KVNamespace,
  date: string,
): Promise<AnalyticsData> {
  const key = `neptu:analytics:${date}`;
  const raw = await cache.get(key);
  return raw ? JSON.parse(raw) : {};
}

/**
 * Get analytics for the last N days
 */
export async function getAnalyticsHistory(
  cache: KVNamespace,
  days: number,
): Promise<Record<string, AnalyticsData>> {
  const history: Record<string, AnalyticsData> = {};
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    history[dateStr] = await getAnalyticsForDate(cache, dateStr);
  }

  return history;
}

/**
 * Calculate success rate for an action
 */
export function calculateSuccessRate(
  stats: AnalyticsData,
  action: string,
): number {
  const actionStats = stats[action];
  if (!actionStats || actionStats.total === 0) return 0;
  return (actionStats.success / actionStats.total) * 100;
}

/**
 * Get summary statistics across all actions
 */
export function getSummaryStats(data: AnalyticsData): {
  totalActions: number;
  successRate: number;
  topActions: Array<{ action: string; count: number }>;
} {
  let totalSuccess = 0;
  let totalFail = 0;
  const actionCounts: Array<{ action: string; count: number }> = [];

  for (const [action, stats] of Object.entries(data)) {
    totalSuccess += stats.success;
    totalFail += stats.fail;
    actionCounts.push({ action, count: stats.total });
  }

  const total = totalSuccess + totalFail;

  return {
    totalActions: total,
    successRate: total > 0 ? (totalSuccess / total) * 100 : 0,
    topActions: actionCounts.sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

/**
 * Track agent engagement limit per agent per day
 */
export async function checkAgentEngagementLimit(
  cache: KVNamespace,
  targetAgentName: string,
  maxPerDay: number = 2,
): Promise<{ allowed: boolean; currentCount: number }> {
  const today = new Date().toISOString().split("T")[0];
  const key = `neptu:agent_engagement:${targetAgentName}:${today}`;
  const raw = await cache.get(key);
  const currentCount = raw ? parseInt(raw, 10) : 0;

  return {
    allowed: currentCount < maxPerDay,
    currentCount,
  };
}

/**
 * Increment agent engagement count
 */
export async function incrementAgentEngagement(
  cache: KVNamespace,
  targetAgentName: string,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const key = `neptu:agent_engagement:${targetAgentName}:${today}`;
  const raw = await cache.get(key);
  const currentCount = raw ? parseInt(raw, 10) : 0;

  await cache.put(key, (currentCount + 1).toString(), {
    expirationTtl: 86400, // 24 hours
  });
}
