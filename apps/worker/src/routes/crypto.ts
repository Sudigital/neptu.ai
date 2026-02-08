/** Crypto Market API routes */
import { Hono } from "hono";
import { NeptuCalculator } from "@neptu/wariga";
import {
  fetchAndStoreCryptoMarketData,
  getCryptoWithMarketData,
  TOP_CRYPTO_COINS,
} from "../colosseum";

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

const crypto = new Hono<{ Bindings: Env }>();

/** Wuku-based cosmic messages for each coin */
const COSMIC_MESSAGES: Record<string, string> = {
  Sinta: "New beginnings favor this coin's energy today",
  Landep: "Sharp insights guide trading decisions",
  Ukir: "Creative energy supports growth potential",
  Kulantir: "Stability and patience rewarded",
  Tolu: "Balance between risk and opportunity",
  Gumbreg: "Hidden value may surface unexpectedly",
  Wariga: "Wisdom of the ancients protects value",
  Warigadian: "Double blessings amplify gains",
  Julungwangi: "Golden opportunities emerge",
  Sungsang: "Reversal energy - expect the unexpected",
  Dungulan: "Steady accumulation favored",
  Kuningan: "Blessed prosperity cycle active",
  Langkir: "Spiritual alignment enhances luck",
  Medangsia: "Market forces align favorably",
  Pujut: "Transformation energy present",
  Pahang: "Protective forces active",
  Krulut: "Interconnected gains possible",
  Merakih: "Calculated risks may pay off",
  Tambir: "Foundation building period",
  Medangkungan: "Leadership energy dominant",
  Matal: "Eye-opening revelations ahead",
  Uye: "Renewal cycle approaching",
  Menail: "Stability through change",
  Perangbakat: "Hidden talents emerge",
  Bala: "Strength in adversity",
  Ugu: "Auspicious timing for action",
  Wayang: "Shadow plays - look beneath surface",
  Klawu: "Cloud cover lifts soon",
  Dukut: "Grass-roots growth continues",
  Watugunung: "Mountain strength supports value",
};

/**
 * GET /api/crypto/market
 * Get crypto market data with birthdays and Neptu cosmic alignment
 */
crypto.get("/market", async (c) => {
  try {
    const calculator = new NeptuCalculator();
    const today = new Date();
    const data = await getCryptoWithMarketData(c.env.DB);

    const dataWithCosmic = data.map((coin) => {
      const coinBirthDate = new Date(coin.birthday);
      const coinPotensi = calculator.calculatePotensi(coinBirthDate);
      const todayReading = calculator.calculatePeluang(today, coinBirthDate);

      const wukuEnergy = coinPotensi.wuku.urip;
      const pancaEnergy = todayReading.panca_wara.urip;
      const saptaEnergy = todayReading.sapta_wara.urip;
      const totalUrip = wukuEnergy + pancaEnergy + saptaEnergy;
      const alignmentScore = Math.min(100, Math.round((totalUrip / 30) * 100));

      const wukuKey =
        coinPotensi.wuku.name.charAt(0).toUpperCase() +
        coinPotensi.wuku.name.slice(1).toLowerCase();

      let athCosmic = null;
      if (coin.athDate) {
        const athDate = new Date(coin.athDate);
        const athReading = calculator.calculatePeluang(athDate, coinBirthDate);
        const athTotalUrip =
          wukuEnergy + athReading.panca_wara.urip + athReading.sapta_wara.urip;
        athCosmic = {
          score: Math.min(100, Math.round((athTotalUrip / 30) * 100)),
          pancaWara: athReading.panca_wara.name,
          saptaWara: athReading.sapta_wara.name,
        };
      }

      let atlCosmic = null;
      if (coin.atlDate) {
        const atlDate = new Date(coin.atlDate);
        const atlReading = calculator.calculatePeluang(atlDate, coinBirthDate);
        const atlTotalUrip =
          wukuEnergy + atlReading.panca_wara.urip + atlReading.sapta_wara.urip;
        atlCosmic = {
          score: Math.min(100, Math.round((atlTotalUrip / 30) * 100)),
          pancaWara: atlReading.panca_wara.name,
          saptaWara: atlReading.sapta_wara.name,
        };
      }

      return {
        ...coin,
        cosmicAlignment: {
          dayName: todayReading.sapta_wara.name,
          pancaWara: todayReading.panca_wara.name,
          saptaWara: todayReading.sapta_wara.name,
          wuku: coinPotensi.wuku.name,
          alignmentScore,
          cosmicMessage:
            COSMIC_MESSAGES[wukuKey] || "Cosmic forces are in motion",
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
      500,
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
    const result = await fetchAndStoreCryptoMarketData(c.env.DB);
    return c.json(result);
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
 * GET /api/crypto/chart/:id
 * Proxy CoinGecko market_chart API with Cloudflare Cache API (free, unlimited).
 * :id is the CoinGecko coin id (e.g., "bitcoin", "ethereum")
 * Query params: days (7|30|90|365, default 365)
 */
crypto.get("/chart/:id", async (c) => {
  const coinId = c.req.param("id");
  const days = c.req.query("days") || "365";
  const allowedDays = new Set(["7", "30", "90", "365"]);

  if (!coinId || !allowedDays.has(days)) {
    return c.json({ error: "Invalid id or days param" }, 400);
  }

  // Use Cloudflare Cache API — free, unlimited, no KV writes
  // Cache key must use the worker's own domain (Cloudflare zone) to work
  const cacheKey = new Request(
    `https://worker.neptu.sudigital.com/_cache/chart/${coinId}/${days}`,
  );
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "HIT",
      },
    });
  }

  // Fetch from CoinGecko demo API (allows cloud IPs)
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-cg-demo-api-key": "CG-FhiKv5fmRFRiVb2M2VxjPg5g",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`CoinGecko chart error: ${res.status}`, body);
    return c.json(
      { error: `CoinGecko returned ${res.status}` },
      res.status === 429 ? 429 : 502,
    );
  }

  const body = await res.text();

  // TTL: 10 min for 7D (more granular), 1 hour for others
  const ttl = days === "7" ? 600 : 3600;
  const response = new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${ttl}`,
      "Access-Control-Allow-Origin": "*",
      "X-Cache": "MISS",
    },
  });

  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
});

/**
 * GET /api/crypto/cosmic/:birthDate
 */
crypto.get("/cosmic/:birthDate", async (c) => {
  const birthDateStr = c.req.param("birthDate");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }

  try {
    const calculator = new NeptuCalculator();
    const today = new Date();
    const birthDate = new Date(birthDateStr);

    const userPotensi = calculator.calculatePotensi(birthDate);
    const todayPeluang = calculator.calculatePeluang(today, birthDate);

    const cryptoData = await getCryptoWithMarketData(c.env.DB);

    const cosmicReadings = cryptoData.map((coin) => {
      const coinBirthDate = new Date(coin.birthday);
      const coinPotensi = calculator.calculatePotensi(coinBirthDate);
      const coinPeluang = calculator.calculatePeluang(today, coinBirthDate);

      const wukuMatch =
        coinPotensi.wuku.name === userPotensi.wuku.name ? 30 : 0;
      const pancawaraMatch =
        coinPeluang.panca_wara.name === todayPeluang.panca_wara.name ? 25 : 0;
      const saptawaraMatch =
        coinPeluang.sapta_wara.name === todayPeluang.sapta_wara.name ? 25 : 0;
      const dayAlignment =
        ((today.getDate() + coinBirthDate.getDate()) % 20) + 1;

      const alignment = Math.min(
        100,
        wukuMatch + pancawaraMatch + saptawaraMatch + dayAlignment,
      );

      let trend: "bullish" | "bearish" | "neutral";
      if (alignment >= 70) trend = "bullish";
      else if (alignment <= 40) trend = "bearish";
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
      500,
    );
  }
});

export { crypto };
