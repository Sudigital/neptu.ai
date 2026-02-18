import { createDatabase, type Database } from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import {
  COSMIC_MESSAGES,
  COSMIC_DEFAULT_MESSAGE,
  COINGECKO_API,
  CHART_CACHE_TTL,
  ALIGNMENT_THRESHOLDS,
  DATE_REGEX,
  TOP_CRYPTO_COINS,
} from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";
/** Crypto Market API routes */
import { Hono } from "hono";

import { redisCache } from "../cache";

const log = createLogger({ name: "crypto" });
import {
  fetchAndStoreCryptoMarketData,
  getCryptoWithMarketData,
} from "../crypto-market-fetcher";

const crypto = new Hono();

// Lazy db initialization to ensure dotenv is loaded first
let _db: Database | null = null;
function getDb(): Database {
  if (!_db) _db = createDatabase();
  return _db;
}

function calculateAlignmentScore(totalUrip: number): number {
  return Math.min(
    ALIGNMENT_THRESHOLDS.MAX_SCORE,
    Math.round(
      (totalUrip / ALIGNMENT_THRESHOLDS.URIP_DIVISOR) *
        ALIGNMENT_THRESHOLDS.MAX_SCORE
    )
  );
}

function getCosmicForDate(
  calculator: NeptuCalculator,
  date: Date,
  coinBirthDate: Date,
  wukuEnergy: number
): { score: number; pancaWara: string; saptaWara: string } {
  const reading = calculator.calculatePeluang(date, coinBirthDate);
  const totalUrip =
    wukuEnergy + reading.panca_wara.urip + reading.sapta_wara.urip;
  return {
    score: calculateAlignmentScore(totalUrip),
    pancaWara: reading.panca_wara.name,
    saptaWara: reading.sapta_wara.name,
  };
}

/**
 * GET /api/crypto/market
 * Get crypto market data with birthdays and Neptu cosmic alignment
 */
crypto.get("/market", async (c) => {
  try {
    const calculator = new NeptuCalculator();
    const today = new Date();
    const data = await getCryptoWithMarketData(getDb());

    const dataWithCosmic = data.map((coin) => {
      const coinBirthDate = new Date(coin.birthday);
      const coinPotensi = calculator.calculatePotensi(coinBirthDate);
      const todayReading = calculator.calculatePeluang(today, coinBirthDate);

      const wukuEnergy = coinPotensi.wuku.urip;
      const pancaEnergy = todayReading.panca_wara.urip;
      const saptaEnergy = todayReading.sapta_wara.urip;
      const totalUrip = wukuEnergy + pancaEnergy + saptaEnergy;
      const alignmentScore = calculateAlignmentScore(totalUrip);

      const wukuKey =
        coinPotensi.wuku.name.charAt(0).toUpperCase() +
        coinPotensi.wuku.name.slice(1).toLowerCase();

      const athCosmic = coin.athDate
        ? getCosmicForDate(
            calculator,
            new Date(coin.athDate),
            coinBirthDate,
            wukuEnergy
          )
        : null;

      const atlCosmic = coin.atlDate
        ? getCosmicForDate(
            calculator,
            new Date(coin.atlDate),
            coinBirthDate,
            wukuEnergy
          )
        : null;

      return {
        ...coin,
        cosmicAlignment: {
          dayName: todayReading.sapta_wara.name,
          pancaWara: todayReading.panca_wara.name,
          saptaWara: todayReading.sapta_wara.name,
          wuku: coinPotensi.wuku.name,
          alignmentScore,
          cosmicMessage: COSMIC_MESSAGES[wukuKey] || COSMIC_DEFAULT_MESSAGE,
        },
        athCosmic,
        atlCosmic,
      };
    });

    return c.json({
      success: true,
      data: dataWithCosmic,
      count: dataWithCosmic.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/crypto/birthdays
 */
crypto.get("/birthdays", (c) => {
  return c.json({
    success: true,
    data: TOP_CRYPTO_COINS,
    count: TOP_CRYPTO_COINS.length,
  });
});

/**
 * POST /api/crypto/refresh
 */
crypto.post("/refresh", async (c) => {
  try {
    const result = await fetchAndStoreCryptoMarketData(getDb());
    return c.json(result);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/crypto/chart/:id
 * Proxy CoinGecko market_chart API with Redis caching.
 * :id is the CoinGecko coin id (e.g., "bitcoin", "ethereum")
 * Query params: days (7|30|90|365, default 365)
 */
crypto.get("/chart/:id", async (c) => {
  const coinId = c.req.param("id");
  const days = c.req.query("days") || "365";
  const allowedDays = new Set<string>(COINGECKO_API.ALLOWED_CHART_DAYS);

  if (!coinId || !allowedDays.has(days)) {
    return c.json({ error: "Invalid id or days param" }, 400);
  }

  const cacheKey = `chart:${coinId}:${days}`;

  const cached = await redisCache.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached), 200, {
      "X-Cache": "HIT",
    });
  }

  const chartUrl = `${COINGECKO_API.BASE_URL}${COINGECKO_API.CHART_ENDPOINT.replace("{id}", coinId)}?vs_currency=${COINGECKO_API.VS_CURRENCY}&days=${days}`;
  const apiKey = process.env.COINGECKO_API_KEY;

  const fetchHeaders: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    fetchHeaders["x-cg-demo-api-key"] = apiKey;
  }

  const res = await fetch(chartUrl, { headers: fetchHeaders });

  if (!res.ok) {
    const body = await res.text();
    log.error("CoinGecko chart error: %d %s", res.status, body);
    return c.json(
      { error: `CoinGecko returned ${res.status}` },
      res.status === 429 ? 429 : 502
    );
  }

  const body = await res.text();

  const ttl = CHART_CACHE_TTL[days] ?? CHART_CACHE_TTL["365"];

  redisCache.put(cacheKey, body, { expirationTtl: ttl });

  return c.json(JSON.parse(body), 200, {
    "X-Cache": "MISS",
  });
});

/**
 * GET /api/crypto/cosmic/:birthDate
 */
crypto.get("/cosmic/:birthDate", async (c) => {
  const birthDateStr = c.req.param("birthDate");

  if (!DATE_REGEX.test(birthDateStr)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }

  try {
    const calculator = new NeptuCalculator();
    const today = new Date();
    const birthDate = new Date(birthDateStr);

    const userPotensi = calculator.calculatePotensi(birthDate);
    const todayPeluang = calculator.calculatePeluang(today, birthDate);

    const cryptoData = await getCryptoWithMarketData(getDb());

    const cosmicReadings = cryptoData.map((coin) => {
      const coinBirthDate = new Date(coin.birthday);
      const coinPotensi = calculator.calculatePotensi(coinBirthDate);
      const coinPeluang = calculator.calculatePeluang(today, coinBirthDate);

      const wukuMatch =
        coinPotensi.wuku.name === userPotensi.wuku.name
          ? ALIGNMENT_THRESHOLDS.WUKU_MATCH_SCORE
          : 0;
      const pancawaraMatch =
        coinPeluang.panca_wara.name === todayPeluang.panca_wara.name
          ? ALIGNMENT_THRESHOLDS.PANCA_MATCH_SCORE
          : 0;
      const saptawaraMatch =
        coinPeluang.sapta_wara.name === todayPeluang.sapta_wara.name
          ? ALIGNMENT_THRESHOLDS.SAPTA_MATCH_SCORE
          : 0;
      const dayAlignment =
        ((today.getDate() + coinBirthDate.getDate()) %
          ALIGNMENT_THRESHOLDS.DAY_ALIGNMENT_MOD) +
        1;

      const alignment = Math.min(
        ALIGNMENT_THRESHOLDS.MAX_SCORE,
        wukuMatch + pancawaraMatch + saptawaraMatch + dayAlignment
      );

      let trend: "bullish" | "bearish" | "neutral";
      if (alignment >= ALIGNMENT_THRESHOLDS.BULLISH) trend = "bullish";
      else if (alignment <= ALIGNMENT_THRESHOLDS.BEARISH) trend = "bearish";
      else trend = "neutral";

      return {
        ...coin,
        cosmicAlignment: alignment,
        trend,
        coinWuku: coinPotensi.wuku.name,
        coinPancawara: coinPeluang.panca_wara.name,
        userWuku: userPotensi.wuku.name,
        userPancawara: todayPeluang.panca_wara.name,
      };
    });

    cosmicReadings.sort((a, b) => b.cosmicAlignment - a.cosmicAlignment);

    return c.json({
      success: true,
      date: today.toISOString().split("T")[0],
      userBirthDate: birthDateStr,
      userWuku: userPotensi.wuku.name,
      readings: cosmicReadings,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export { crypto };
