/** Oracle API routes */
import { Hono } from "hono";
import { NeptuCalculator } from "@neptu/wariga";
import { NeptuOracle } from "../ai/oracle";

interface Env {
  DB: D1Database;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_ENDPOINT: string;
  AZURE_OPENAI_DEPLOYMENT: string;
  AZURE_OPENAI_API_VERSION: string;
  CACHE: KVNamespace;
}

const oracle = new Hono<{ Bindings: Env }>();

/**
 * POST /api/oracle
 * Ask the AI oracle a question about a reading
 */
oracle.post("/", async (c) => {
  const body = await c.req.json<{
    question: string;
    birthDate: string;
    targetDate?: string;
    language?: string;
  }>();

  if (!body.question || !body.birthDate) {
    return c.json({ error: "question and birthDate are required" }, 400);
  }

  if (!c.env.AZURE_OPENAI_API_KEY) {
    return c.json({ error: "AI oracle not configured" }, 503);
  }

  try {
    const calculator = new NeptuCalculator();
    const oracleAI = new NeptuOracle({
      apiKey: c.env.AZURE_OPENAI_API_KEY,
      endpoint: c.env.AZURE_OPENAI_ENDPOINT,
      deployment: c.env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: c.env.AZURE_OPENAI_API_VERSION,
    });

    const birthDate = new Date(body.birthDate);
    const potensi = calculator.calculatePotensi(birthDate);
    const language = body.language || "en";

    let peluang;
    if (body.targetDate) {
      const targetDate = new Date(body.targetDate);
      peluang = calculator.calculatePeluang(targetDate, birthDate);
    }

    const response = await oracleAI.askQuestion(
      body.question,
      potensi,
      peluang,
      c.env.CACHE,
      language,
    );

    return c.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("[Oracle] askQuestion error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get oracle response",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * GET /api/oracle/daily/:birthDate
 * Get daily AI interpretation for a user
 * Query params: ?language=en (default: en)
 */
oracle.get("/daily/:birthDate", async (c) => {
  const birthDateStr = c.req.param("birthDate");
  const language = c.req.query("language") || "en";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }

  if (!c.env.AZURE_OPENAI_API_KEY) {
    return c.json({ error: "AI oracle not configured" }, 503);
  }

  try {
    const calculator = new NeptuCalculator();
    const oracleAI = new NeptuOracle({
      apiKey: c.env.AZURE_OPENAI_API_KEY,
      endpoint: c.env.AZURE_OPENAI_ENDPOINT,
      deployment: c.env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: c.env.AZURE_OPENAI_API_VERSION,
    });

    const birthDate = new Date(birthDateStr);
    const today = new Date();

    const potensi = calculator.calculatePotensi(birthDate);
    const peluang = calculator.calculatePeluang(today, birthDate);

    const response = await oracleAI.getDailyInterpretation(
      potensi,
      peluang,
      c.env.CACHE,
      language,
    );

    return c.json({
      success: true,
      date: today.toISOString().split("T")[0],
      ...response,
    });
  } catch (error) {
    console.error("[Oracle] dailyInterpretation error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get daily interpretation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /api/oracle/interpret
 * Get AI interpretation for a specific date based on user's birth chart
 */
oracle.post("/interpret", async (c) => {
  const body = await c.req.json<{
    birthDate: string;
    targetDate: string;
    language?: string;
  }>();

  if (!body.birthDate || !body.targetDate) {
    return c.json({ error: "birthDate and targetDate are required" }, 400);
  }

  if (!c.env.AZURE_OPENAI_API_KEY) {
    return c.json({ error: "AI oracle not configured" }, 503);
  }

  const language = body.language || "en";

  // Check cache first (include language in cache key)
  const cacheKey = `interpret:${body.birthDate}:${body.targetDate}:${language}`;
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) {
    return c.json({
      success: true,
      interpretation: cached,
      date: body.targetDate,
      cached: true,
    });
  }

  try {
    const calculator = new NeptuCalculator();
    const oracleAI = new NeptuOracle({
      apiKey: c.env.AZURE_OPENAI_API_KEY,
      endpoint: c.env.AZURE_OPENAI_ENDPOINT,
      deployment: c.env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: c.env.AZURE_OPENAI_API_VERSION,
    });

    const birthDate = new Date(body.birthDate);
    const targetDate = new Date(body.targetDate);

    const potensi = calculator.calculatePotensi(birthDate);
    const peluang = calculator.calculatePeluang(targetDate, birthDate);

    const interpretation = await oracleAI.getDateInterpretation(
      potensi,
      peluang,
      targetDate,
      c.env.CACHE,
      language,
    );

    // Cache for 6 hours
    await c.env.CACHE.put(cacheKey, interpretation, { expirationTtl: 21600 });

    return c.json({
      success: true,
      interpretation,
      date: body.targetDate,
      cached: false,
    });
  } catch (error) {
    console.error("[Oracle] interpret error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get interpretation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export { oracle };
