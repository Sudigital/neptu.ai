/** Colosseum Project Management routes */
import { Hono } from "hono";
import { ColosseumClient } from "../colosseum";

const colosseumProject = new Hono();

/**
 * POST /api/colosseum/update-posts-url
 */
colosseumProject.post("/update-posts-url", async (c) => {
  if (!process.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
    COLOSSEUM_AGENT_ID: process.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: process.env.COLOSSEUM_AGENT_NAME,
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
colosseumProject.post("/fix-arena-url", async (c) => {
  if (!process.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
    COLOSSEUM_AGENT_ID: process.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: process.env.COLOSSEUM_AGENT_NAME,
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
colosseumProject.post("/update-project-url", async (c) => {
  if (!process.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
    COLOSSEUM_AGENT_ID: process.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: process.env.COLOSSEUM_AGENT_NAME,
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
colosseumProject.post("/update-project-description", async (c) => {
  if (!process.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
    COLOSSEUM_AGENT_ID: process.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: process.env.COLOSSEUM_AGENT_NAME,
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
 * POST /api/colosseum/update-presentation
 * Update the presentation link and optionally submit the project
 */
colosseumProject.post("/update-presentation", async (c) => {
  if (!process.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
    COLOSSEUM_AGENT_ID: process.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: process.env.COLOSSEUM_AGENT_NAME,
  });

  const presentationLink =
    "https://www.loom.com/share/c7f5f28890d346a3965c2bd1c13a6ec5";

  try {
    // Update the presentation link
    await client.updateProject({
      presentationLink,
    });

    // Submit the project
    const submitResult = await client.submitProject();

    return c.json({
      success: true,
      presentationLink,
      project: submitResult.project,
      status: submitResult.project.status,
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
colosseumProject.post("/vote-self", async (c) => {
  if (!process.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
    COLOSSEUM_AGENT_ID: process.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: process.env.COLOSSEUM_AGENT_NAME,
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

export { colosseumProject };
