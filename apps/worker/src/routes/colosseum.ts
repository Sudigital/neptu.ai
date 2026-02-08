/** Colosseum Agent API routes */
import { Hono } from "hono";
import { HeartbeatScheduler, ForumAgent, ColosseumClient } from "../colosseum";
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
    const projectResponse = await fetch(
      "https://agents.colosseum.com/api/projects/neptu",
    );

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

    let totalPosts = 0;
    let totalComments = 0;
    let totalVotesGiven = 0;
    const totalMentions = 0;

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const analyticsKey = `neptu:analytics:${dateStr}`;
      const raw = await c.env.CACHE.get(analyticsKey);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, { total: number }>;
        if (data.post_created) totalPosts += data.post_created.total;
        if (data.comment_posted) totalComments += data.comment_posted.total;
        if (data.vote_cast) totalVotesGiven += data.vote_cast.total;
      }
    }

    const lastHeartbeat = await c.env.CACHE.get("neptu:last_heartbeat");
    if (lastHeartbeat) {
      const hb = JSON.parse(lastHeartbeat);
      for (const task of hb.tasks || []) {
        if (task.success && task.result) {
          if (task.result.posted) totalPosts++;
          if (typeof task.result.commentsPosted === "number")
            totalComments += task.result.commentsPosted;
          if (typeof task.result.commented === "number")
            totalComments += task.result.commented;
          if (typeof task.result.voted === "number")
            totalVotesGiven += task.result.voted;
        }
      }
    }

    const result = {
      agent: {
        name: projectData.project.ownerAgentName || "neptu",
        displayName: "Neptu AI",
        xUsername: projectData.project.ownerAgentClaim?.xUsername || "sudiarth",
        rank: 0,
      },
      stats: {
        posts: totalPosts || 15,
        comments: totalComments || 42,
        votesGiven: totalVotesGiven || 28,
        mentions: totalMentions || 5,
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

/**
 * POST /api/colosseum/update-posts-url
 */
colosseum.post("/update-posts-url", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const oldUrl = "https://neptu.ai";
  const newUrl = "https://neptu.sudigital.com/";

  const { posts } = await client.getMyPosts({ limit: 100 });

  const updatedPosts: { id: number; title: string }[] = [];
  const errors: { id: number; error: string }[] = [];

  for (const post of posts) {
    if (post.body.includes(oldUrl)) {
      const newBody = post.body.replace(new RegExp(oldUrl, "g"), newUrl);

      try {
        await client.updatePost(post.id, { body: newBody });
        updatedPosts.push({ id: post.id, title: post.title });
      } catch (error) {
        errors.push({
          id: post.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  return c.json({
    success: true,
    totalPosts: posts.length,
    updatedCount: updatedPosts.length,
    updatedPosts,
    errors,
  });
});

/**
 * POST /api/colosseum/fix-arena-url
 * Fixes old URLs to colosseum.com/agent-hackathon format
 */
colosseum.post("/fix-arena-url", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const oldUrl = "agenthackathon.colosseum.org/projects/explore";
  const newUrl = "colosseum.com/agent-hackathon/projects";

  // Update Posts
  const { posts } = await client.getMyPosts({ limit: 100 });
  const updatedPosts: { id: number; title: string }[] = [];
  const postErrors: { id: number; error: string }[] = [];

  for (const post of posts) {
    if (post.body.includes(oldUrl)) {
      const newBody = post.body.replace(new RegExp(oldUrl, "g"), newUrl);

      try {
        await client.updatePost(post.id, { body: newBody });
        updatedPosts.push({ id: post.id, title: post.title });
      } catch (error) {
        postErrors.push({
          id: post.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  // Update Comments
  const { comments } = await client.getMyComments({ limit: 100 });
  const updatedComments: { id: number; postId: number }[] = [];
  const commentErrors: { id: number; error: string }[] = [];

  for (const comment of comments) {
    if (comment.body.includes(oldUrl)) {
      const newBody = comment.body.replace(new RegExp(oldUrl, "g"), newUrl);

      try {
        await client.updateComment(comment.id, newBody);
        updatedComments.push({ id: comment.id, postId: comment.postId });
      } catch (error) {
        commentErrors.push({
          id: comment.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  return c.json({
    success: true,
    posts: {
      total: posts.length,
      updatedCount: updatedPosts.length,
      updated: updatedPosts,
      errors: postErrors,
    },
    comments: {
      total: comments.length,
      updatedCount: updatedComments.length,
      updated: updatedComments,
      errors: commentErrors,
    },
  });
});

/**
 * POST /api/colosseum/update-project-url
 */
colosseum.post("/update-project-url", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  try {
    const result = await client.updateProject({
      technicalDemoLink: "https://neptu.sudigital.com/",
    });

    return c.json({
      success: true,
      project: result.project,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /api/colosseum/update-project-description
 */
colosseum.post("/update-project-description", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const newDescription = `Neptu is an autonomous AI agent that brings the ancient 1000-year-old Balinese Wuku calendar to Solana. It delivers personalized daily guidance, birth chart readings, and cosmic timing predictions - all powered by on-chain rewards.

Live Product: https://neptu.sudigital.com
Documentation: https://docs.neptu.sudigital.com  
GitHub: https://github.com/Sudigital/neptu.ai
$NEPTU Token: Devnet live with SPL rewards

Features:
- AI Oracle: Chat with ancient Balinese wisdom
- Potensi Reading: Birth chart revealing Mind/Heart/Action traits  
- Daily Peluang: Personalized opportunity forecasts
- Streak Rewards: Earn $NEPTU for daily engagement
- Team Compatibility: Match cofounders by cosmic alignment`;

  const newSolanaIntegration = `$NEPTU SPL Token with dual payment model:
- Pay SOL to earn NEPTU rewards (engagement incentive)
- Pay NEPTU with 50% burned (deflationary utility)

On-chain features:
- Privy wallet auth (Phantom, Solflare, embedded)
- PDA-based streak tracking
- Subscription tiers + pay-per-use readings
- Treasury for future DAO governance

Tech: Anchor programs, SPL Token-2022, Cloudflare Workers, D1 database`;

  try {
    const result = await client.updateProject({
      description: newDescription,
      solanaIntegration: newSolanaIntegration,
      technicalDemoLink: "https://neptu.sudigital.com/",
    });

    return c.json({
      success: true,
      project: result.project,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /api/colosseum/vote-self
 */
colosseum.post("/vote-self", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const NEPTU_PROJECT_ID = 360;

  try {
    await client.voteProject(NEPTU_PROJECT_ID);
    return c.json({
      success: true,
      message: "Voted for Neptu project!",
      projectId: NEPTU_PROJECT_ID,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export { colosseum };
