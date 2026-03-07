import type { CompatibilityPair } from "@neptu/shared";

import { zValidator } from "@hono/zod-validator";
import { createLogger } from "@neptu/logger";
import {
  MAX_COMPATIBILITY_PEOPLE,
  MIN_COMPATIBILITY_PEOPLE,
} from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";
import { Hono } from "hono";
import { z } from "zod";

import { dynamicJwtAuth } from "../../middleware/dynamic-jwt-auth";

const log = createLogger({ name: "reading" });

export const readingRoutes = new Hono();

// All reading routes require Dynamic JWT authentication
readingRoutes.use("/*", dynamicJwtAuth);

const calculator = new NeptuCalculator();

function getWorkerUrl(): string {
  return process.env.WORKER_URL || "http://localhost:8787";
}

// Helper to parse date string to Date object
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Schema for date input
const dateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

const compatibilitySchema = z.object({
  birthDate1: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  birthDate2: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

/**
 * GET /api/reading/potensi?date=YYYY-MM-DD
 * Get POTENSI (life potential) reading based on birth date
 */
readingRoutes.get("/potensi", zValidator("query", dateSchema), (c) => {
  const { date } = c.req.valid("query");

  try {
    const birthDate = parseDate(date);
    const potensi = calculator.calculatePotensi(birthDate);
    return c.json({
      success: true,
      type: "potensi",
      date,
      reading: potensi,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate potensi",
      },
      400
    );
  }
});

/**
 * GET /api/reading/peluang?date=YYYY-MM-DD
 * Get PELUANG (daily opportunity) reading for a specific date
 */
readingRoutes.get("/peluang", zValidator("query", dateSchema), (c) => {
  const { date } = c.req.valid("query");

  try {
    const targetDate = parseDate(date);
    const peluang = calculator.calculatePeluang(targetDate);
    return c.json({
      success: true,
      type: "peluang",
      date,
      reading: peluang,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate peluang",
      },
      400
    );
  }
});

/**
 * GET /api/reading/today
 * Get today's PELUANG reading
 */
readingRoutes.get("/today", (c) => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  try {
    const peluang = calculator.calculatePeluang(today);
    return c.json({
      success: true,
      type: "peluang",
      date: todayStr,
      reading: peluang,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate today's peluang",
      },
      400
    );
  }
});

/**
 * POST /api/reading/compatibility
 * Check compatibility between two birth dates (Mitra Satru)
 */
readingRoutes.post(
  "/compatibility",
  zValidator("json", compatibilitySchema),
  (c) => {
    const { birthDate1, birthDate2 } = c.req.valid("json");

    try {
      const date1 = parseDate(birthDate1);
      const date2 = parseDate(birthDate2);

      const compatibility = calculator.calculateCompatibility(date1, date2);

      return c.json({
        success: true,
        type: "compatibility",
        birthDate1,
        birthDate2,
        reading: compatibility,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to calculate compatibility",
        },
        400
      );
    }
  }
);

// Schema for batch compatibility input
const batchCompatibilitySchema = z.object({
  birthDates: z
    .array(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    )
    .min(MIN_COMPATIBILITY_PEOPLE)
    .max(MAX_COMPATIBILITY_PEOPLE),
});

/**
 * POST /api/reading/compatibility/batch
 * Check compatibility between multiple birth dates (all pairwise Mitra Satru)
 */
readingRoutes.post(
  "/compatibility/batch",
  zValidator("json", batchCompatibilitySchema),
  (c) => {
    const { birthDates } = c.req.valid("json");

    try {
      const dates = birthDates.map(parseDate);
      const pairs: CompatibilityPair[] = [];

      for (let i = 0; i < dates.length; i++) {
        for (let j = i + 1; j < dates.length; j++) {
          pairs.push({
            personA: i,
            personB: j,
            result: calculator.calculateCompatibility(dates[i], dates[j]),
          });
        }
      }

      return c.json({
        success: true,
        type: "compatibility",
        birthDates,
        pairs,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to calculate compatibility",
        },
        400
      );
    }
  }
);

/**
 * GET /api/reading/full?birthDate=YYYY-MM-DD&targetDate=YYYY-MM-DD
 * Get full reading: POTENSI + PELUANG for target date
 */
readingRoutes.get(
  "/full",
  zValidator(
    "query",
    z.object({
      birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "birthDate must be YYYY-MM-DD format"),
      targetDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "targetDate must be YYYY-MM-DD format")
        .optional(),
    })
  ),
  (c) => {
    const { birthDate, targetDate } = c.req.valid("query");
    const birth = parseDate(birthDate);
    const target = targetDate ? parseDate(targetDate) : new Date();
    const targetStr = targetDate || target.toISOString().split("T")[0];

    try {
      const fullReading = calculator.getFullReading(birth, target);

      return c.json({
        success: true,
        type: "full",
        birthDate,
        targetDate: targetStr,
        reading: fullReading,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to calculate full reading",
        },
        400
      );
    }
  }
);

/**
 * POST /api/v1/reading/oracle
 * Text-only AI oracle (no TTS). Proxies to Worker /api/oracle.
 * Body: { question: string, birthDate: string, targetDate?: string, language?: string }
 */
readingRoutes.post(
  "/oracle",
  zValidator(
    "json",
    z.object({
      question: z.string().min(1).max(2000),
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      targetDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      language: z.string().max(10).optional(),
    })
  ),
  async (c) => {
    const { question, birthDate, targetDate, language } = c.req.valid("json");

    try {
      const workerUrl = getWorkerUrl();
      const res = await fetch(`${workerUrl}/api/oracle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          birthDate,
          targetDate,
          language: language || "en",
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        log.error(
          { status: res.status, body: errorBody },
          "Worker oracle call failed"
        );
        throw new Error(`Oracle service returned ${res.status}`);
      }

      const data = (await res.json()) as {
        success: boolean;
        message: string;
        cached: boolean;
        tokensUsed?: number;
      };

      return c.json({
        success: data.success,
        message: data.message,
        cached: data.cached,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Oracle request failed",
        },
        500
      );
    }
  }
);
