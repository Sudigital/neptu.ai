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
    // Handle both possible field names from API (interface vs actual response)
    const engagement = (agentStatus.engagement || {}) as Record<string, number>;
    const postsCount =
      engagement.postsCreated ??
      engagement.forumPostCount ??
      myPostsData.posts?.length ??
      0;
    const commentsCount =
      engagement.commentsCreated ?? myCommentsData.comments?.length ?? 0;
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

    await c.env.CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 300,
    });

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
  });

  const result = await heartbeat.runHeartbeat();
  return c.json(result);
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

// Mount project management routes
import { colosseumProject } from "./colosseum-project";
colosseum.route("/", colosseumProject);

export { colosseum };
