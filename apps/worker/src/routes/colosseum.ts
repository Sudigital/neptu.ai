/** Colosseum Agent API routes */
import { Hono } from "hono";
import { HeartbeatScheduler, ForumAgent, ColosseumClient } from "../colosseum";
import type { LeaderboardEntry } from "../colosseum";
import {
  postMarketMoverAlert,
  postMarketSentimentReport,
} from "../colosseum/post-creator";
import { NeptuCalculator } from "@neptu/wariga";
import { getCryptoWithMarketData } from "../colosseum/crypto-market-fetcher";

interface Env {
  CACHE: KVNamespace;
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID: string;
  COLOSSEUM_AGENT_NAME: string;
  DB: D1Database;
}

const colosseum = new Hono<{ Bindings: Env }>();

/** GET /api/colosseum/status */
colosseum.get("/status", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const status = await client.getStatus();
  return c.json(status);
});

/** GET /api/colosseum/project-votes */
colosseum.get("/project-votes", async (c) => {
  const cacheKey = "colosseum:project:neptu:votes";
  const cached = await c.env.CACHE.get(cacheKey);

  if (cached) {
    return c.json(JSON.parse(cached));
  }

  try {
    const response = await fetch(
      "https://agents.colosseum.com/api/projects/neptu",
    );

    if (!response.ok) {
      return c.json({ error: "Failed to fetch project data" }, 500);
    }

    const data = (await response.json()) as {
      project: {
        humanUpvotes: number;
        agentUpvotes: number;
        name: string;
        slug: string;
      };
    };

    const result = {
      humanVotes: data.project.humanUpvotes,
      agentVotes: data.project.agentUpvotes,
      totalVotes: data.project.humanUpvotes + data.project.agentUpvotes,
      projectName: data.project.name,
      projectSlug: data.project.slug,
      updatedAt: new Date().toISOString(),
    };

    await c.env.CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 300,
    });

    return c.json(result);
  } catch (error) {
    console.error("Error fetching project votes:", error);
    return c.json({ error: "Failed to fetch vote data" }, 500);
  }
});

/** GET /api/colosseum/agent-stats */
colosseum.get("/agent-stats", async (c) => {
  const cacheKey = "colosseum:agent:neptu:stats";
  const cached = await c.env.CACHE.get(cacheKey);

  if (cached) {
    return c.json(JSON.parse(cached));
  }

  try {
    // Fetch project data and agent status in parallel for real-time stats
    const client = new ColosseumClient({
      COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
      COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
      COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    });

    const [
      projectResponse,
      agentStatus,
      leaderboardData,
      myPostsData,
      myCommentsData,
    ] = await Promise.all([
      fetch("https://agents.colosseum.com/api/projects/neptu"),
      client.getStatus(),
      client.getLeaderboard().catch(() => ({ leaderboard: [] })),
      client.getMyPosts({ limit: 100 }).catch(() => ({ posts: [] })),
      client.getMyComments({ limit: 100 }).catch(() => ({ comments: [] })),
    ]);

    if (!projectResponse.ok) {
      return c.json({ error: "Failed to fetch project data" }, 500);
    }

    const projectData = (await projectResponse.json()) as {
      project: {
        humanUpvotes: number;
        agentUpvotes: number;
        name: string;
        slug: string;
        ownerAgentName: string;
        ownerAgentClaim?: {
          xUsername?: string;
        };
      };
    };

    // Use real data from Colosseum API
    // Prefer actual counts from getMyPosts/getMyComments over status API (which can be stale)
    const engagement = (agentStatus.engagement || {}) as Record<string, number>;
    const postsCount =
      myPostsData.posts?.length ?? engagement.postsCreated ?? 0;
    const commentsCount =
      myCommentsData.comments?.length ?? engagement.commentsCreated ?? 0;
    const votesReceived =
      engagement.votesReceived ?? engagement.repliesOnYourPosts ?? 0;

    // Find rank from leaderboard
    const leaderboard = leaderboardData.leaderboard || [];
    const neptuEntry = leaderboard.find(
      (entry: LeaderboardEntry) => entry.project.slug === "neptu",
    );
    const rank = neptuEntry?.rank || 0;

    const result = {
      agent: {
        name: projectData.project.ownerAgentName || "neptu",
        displayName: "Neptu AI",
        xUsername: projectData.project.ownerAgentClaim?.xUsername || "sudiarth",
        rank,
      },
      stats: {
        posts: postsCount,
        comments: commentsCount,
        mentions: votesReceived,
      },
      project: {
        name: projectData.project.name,
        slug: projectData.project.slug,
        humanVotes: projectData.project.humanUpvotes,
        agentVotes: projectData.project.agentUpvotes,
        totalVotes:
          projectData.project.humanUpvotes + projectData.project.agentUpvotes,
      },
      projectUrl: `https://colosseum.com/agent-hackathon/projects/${projectData.project.slug}`,
      updatedAt: new Date().toISOString(),
    };

    // Best-effort cache — don't fail if KV limit exceeded
    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 300,
      });
    } catch {
      console.warn(
        "KV cache write failed for agent-stats (limit likely exceeded)",
      );
    }

    return c.json(result);
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    return c.json({ error: "Failed to fetch agent stats" }, 500);
  }
});

/** POST /api/colosseum/heartbeat */
colosseum.post("/heartbeat", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const heartbeat = new HeartbeatScheduler({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
    DB: c.env.DB,
  });

  const phase =
    (c.req.query("phase") as
      | "reply_comments"
      | "comment_others"
      | "post_thread"
      | "vote"
      | "other_activity") || "reply_comments";

  const result = await heartbeat.runHeartbeat(phase);
  return c.json(result);
});

/** GET /api/colosseum/debug-comments — shows raw comment data for debugging */
colosseum.get("/debug-comments", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const selfName = (c.env.COLOSSEUM_AGENT_NAME || "neptu").toLowerCase();
  const selfId = parseInt(c.env.COLOSSEUM_AGENT_ID || "206");
  const { posts } = await client.getMyPosts({ limit: 3 });

  const debugData = [];
  for (const post of posts.slice(0, 2)) {
    const { comments } = await client.listComments(post.id, {
      sort: "new",
      limit: 10,
    });
    debugData.push({
      postId: post.id,
      postTitle: post.title.slice(0, 50),
      comments: comments.map((cm) => ({
        id: cm.id,
        agentId: cm.agentId,
        agentName: cm.agentName,
        bodyPreview: cm.body.slice(0, 80),
        isOwn:
          (cm.agentName || "").toLowerCase() === selfName ||
          cm.agentId === selfId,
      })),
    });
  }

  return c.json({ selfName, selfId, posts: debugData });
});

/** POST /api/colosseum/post-intro */
colosseum.post("/post-intro", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const post = await forumAgent.postIntroduction();
  return c.json({ success: true, post });
});

/** POST /api/colosseum/post-predictions */
colosseum.post("/post-predictions", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const post = await forumAgent.postPeluangPredictions();
  return c.json({ success: true, post });
});

/**
 * POST /api/colosseum/post-voter-rewards
 */
colosseum.post("/post-voter-rewards", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const post = await forumAgent.postVoterRewards();
  return c.json({ success: true, post });
});

/**
 * POST /api/colosseum/post-market-alert/:symbol
 * Post a market mover alert for a specific coin
 */
colosseum.post("/post-market-alert/:symbol", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const symbol = c.req.param("symbol").toUpperCase();
  const cryptosWithMarket = await getCryptoWithMarketData(c.env.DB);
  const coinData = cryptosWithMarket.find((coin) => coin.symbol === symbol);

  if (!coinData) {
    return c.json({ error: `Coin ${symbol} not found in tracked coins` }, 404);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const calculator = new NeptuCalculator();
  const post = await postMarketMoverAlert(
    client,
    calculator,
    coinData,
    c.env.CACHE,
  );
  return c.json({ success: true, post });
});

/**
 * POST /api/colosseum/post-market-sentiment
 * Post market sentiment report with BTC dominance and market overview
 */
colosseum.post("/post-market-sentiment", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const cryptosWithMarket = await getCryptoWithMarketData(c.env.DB);

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const calculator = new NeptuCalculator();
  const post = await postMarketSentimentReport(
    client,
    calculator,
    cryptosWithMarket,
    c.env.CACHE,
  );
  return c.json({ success: true, post });
});

/**
 * GET /api/colosseum/reading/:birthDate
 */
colosseum.get("/reading/:birthDate", async (c) => {
  const birthDate = c.req.param("birthDate");
  const targetDate = c.req.query("targetDate");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return c.json({ error: "Invalid birthDate format. Use YYYY-MM-DD" }, 400);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY || "",
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const reading = forumAgent.generatePeluangReading(birthDate, targetDate);
  return c.json({ success: true, reading });
});

/**
 * GET /api/colosseum/leaderboard
 */
colosseum.get("/leaderboard", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const leaderboard = await client.getLeaderboard();
  return c.json(leaderboard);
});

/**
 * GET /api/colosseum/forum
 */
colosseum.get("/forum", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const sort = (c.req.query("sort") as "hot" | "new" | "top") || "hot";
  const limit = parseInt(c.req.query("limit") || "20");

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const posts = await client.listPosts({ sort, limit });
  return c.json(posts);
});

/** POST /api/colosseum/cosmic-update — Force update existing cosmic posts (KV-free) */
colosseum.post("/cosmic-update", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const { NeptuCalculator } = await import("@neptu/wariga");
  const {
    ColosseumClient,
    generateAgentReading,
    buildBatchBody,
    hashAgentNameToDate,
  } = await import("../colosseum");

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });
  const calculator = new NeptuCalculator();

  const COSMIC_TITLE_PATTERNS = [
    "Cosmic Builder Profiles",
    "Wuku Energy Report",
    "Hackathon Stars Aligned",
    "Builders' Cosmic DNA",
    "Ancient Wisdom",
  ];

  // Step 1: Get our posts and filter to cosmic ones
  const { posts: myPosts } = await client.getMyPosts({
    sort: "new",
    limit: 100,
  });

  // Only target old posts with emoji prefix (🌴) that need updating
  const onlyOld = c.req.query("old") === "true";
  const cosmicPosts = myPosts.filter((p) => {
    const matchesPattern = COSMIC_TITLE_PATTERNS.some((pattern) =>
      p.title.includes(pattern),
    );
    if (!matchesPattern) return false;
    // Must have Vol. X/Y in title
    if (!/Vol\.\s*\d+\s*\/\s*\d+/.test(p.title)) return false;
    // If old-only mode, filter to posts with emoji prefix
    if (onlyOld) return p.title.includes("\u{1F334}"); // 🌴
    return true;
  });

  if (cosmicPosts.length === 0) {
    return c.json({
      success: false,
      error: "No cosmic posts found",
      posts: myPosts.length,
    });
  }

  const results: {
    postId: number;
    title: string;
    status: string;
    agentCount?: number;
  }[] = [];

  for (const post of cosmicPosts) {
    try {
      // Extract @mentions from old body to get agent list
      const mentionRegex = /@([A-Za-z0-9_-]+)/g;
      const body = post.body || "";
      const mentions = new Set<string>();
      let match;
      while ((match = mentionRegex.exec(body)) !== null) {
        const name = match[1];
        // Skip our own agent name
        if (name.toLowerCase() !== "neptu") {
          mentions.add(name);
        }
      }

      if (mentions.size === 0) {
        results.push({
          postId: post.id,
          title: post.title,
          status: "skipped_no_agents",
        });
        continue;
      }

      // Build agent profiles from mentions using hash-based dates
      const agents = Array.from(mentions).map((name) => ({
        name,
        firstSeenDate: hashAgentNameToDate(name),
      }));

      // Sort by firstSeenDate for consistent ordering
      agents.sort(
        (a, b) =>
          new Date(a.firstSeenDate).getTime() -
          new Date(b.firstSeenDate).getTime(),
      );

      // Extract volume number to use in regenerated body
      const volMatch = post.title.match(/Vol\.\s*(\d+)\s*\/\s*(\d+)/);
      const volumeNumber = volMatch ? parseInt(volMatch[1], 10) : 1;
      const totalVolumes = volMatch ? parseInt(volMatch[2], 10) : 1;

      // Generate readings for these specific agents
      const readings = agents.map((agent) =>
        generateAgentReading(calculator, agent),
      );

      // Build batch object for body generation
      const batch = {
        volumeNumber,
        totalVolumes,
        readings,
      };

      const newBody = buildBatchBody(batch);
      const safeBody =
        newBody.length > 9900 ? newBody.slice(0, 9900) + "\n..." : newBody;

      await client.updatePost(post.id, {
        body: safeBody,
        tags: ["progress-update", "ai", "consumer"],
      });

      results.push({
        postId: post.id,
        title: post.title,
        status: "updated",
        agentCount: mentions.size,
      });

      // Rate limit between updates (12s = max ~5 writes/min, well within 30/hr)
      await new Promise((r) => setTimeout(r, 12000));
    } catch (error) {
      results.push({
        postId: post.id,
        title: post.title,
        status: `error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return c.json({ success: true, results });
});

// Mount project management routes
import { colosseumProject } from "./colosseum-project";
colosseum.route("/", colosseumProject);

export { colosseum };
