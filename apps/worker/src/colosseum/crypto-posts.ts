/**
 * Crypto Cosmic Post Creators
 * Handles generation of crypto-related forum posts
 */

import type { ForumPost } from "./client";
import type { ColosseumClient } from "./client";
import type { NeptuCalculator } from "@neptu/wariga";
import { getWukuMeaning } from "./forum-constants";
import { TOP_CRYPTO_COINS } from "./crypto-birthdays";
import type { CacheStore } from "../cache";
import type { CryptoWithMarketData } from "./crypto-market-fetcher";
import {
  type CoinReading,
  type CoinReadingWithMarket,
  calculatePricePosition,
  getFibonacciLevel,
  generatePrediction,
  calculateCoinAlignment,
  generateCosmicForecast,
} from "./crypto-alignment";

const NEPTU_URL = "https://neptu.sudigital.com";
const VOTE_URL = "https://colosseum.com/agent-hackathon/projects/neptu";

/**
 * Generate daily crypto cosmic report for top 11 coins
 */
export async function postCryptoCosmicReport(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cache: CacheStore,
): Promise<ForumPost> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get today's overall energy
  const todayPotensi = calculator.calculatePotensi(today);
  const wukuName = todayPotensi.wuku?.name || "Unknown";
  const pancaWara = todayPotensi.panca_wara?.name || "";
  const saptaWara = todayPotensi.sapta_wara?.name || "";

  // Calculate readings for all coins
  const coinReadings: CoinReading[] = TOP_CRYPTO_COINS.map((coin) => {
    const coinBirthday = new Date(coin.birthday);
    const reading = calculateCoinAlignment(calculator, coinBirthday, today);
    return {
      coin,
      ...reading,
    };
  });

  // Sort by alignment score (highest first)
  coinReadings.sort((a, b) => b.alignment - a.alignment);

  // Get top 3 bullish coins
  const topBullish = coinReadings
    .filter((r) => r.trend === "bullish")
    .slice(0, 3);

  // Build the post
  const title = `🌴 Crypto Cosmic Report — ${formattedDate}`;

  // Build coin readings section with links
  const coinSections = coinReadings
    .map((r, index) => {
      const trendEmoji =
        r.trend === "bullish" ? "🚀" : r.trend === "bearish" ? "📉" : "➡️";
      const rank = index + 1;
      const coinLink = `${NEPTU_URL}/cryptos/${r.coin.symbol.toLowerCase()}`;
      return `### ${rank}. [${r.coin.symbol}](${coinLink}) — ${r.coin.name}
**Birthday:** ${r.coin.birthday} | **Alignment:** ${r.alignment}/100 ${trendEmoji}
> ${r.energy}
> **Action:** ${r.action}
> 📊 [View Full Analysis →](${coinLink})
`;
    })
    .join("\n");

  // Top picks section
  const topPicksSection =
    topBullish.length > 0
      ? `## 🔥 Today's Top Cosmic Picks

${topBullish
  .map((r) => {
    const coinLink = `${NEPTU_URL}/cryptos/${r.coin.symbol.toLowerCase()}`;
    return `- **[${r.coin.symbol}](${coinLink})** (${r.alignment}/100) — ${r.energy}`;
  })
  .join("\n")}
`
      : "";

  const body = `# 🌴 Daily Crypto Cosmic Report

*Ancient Balinese astrology meets crypto markets*

---

## 📅 Cosmic Weather — ${formattedDate}

| Cycle | Value |
|-------|-------|
| 🌺 **Wuku** | ${wukuName} |
| ⭐ **Pancawara** | ${pancaWara} |
| 📿 **Saptawara** | ${saptaWara} |

**Overall Market Energy:** ${getWukuMeaning(wukuName)}

---

${topPicksSection}

## 📊 Top Crypto Coins — Cosmic Alignment

${coinSections}

---

## 🔮 How We Calculate Cosmic Alignment

Each crypto has a "birthday" — its genesis block or mainnet launch. Using the **Balinese Wuku calendar** (1000+ years old):

| Factor | Description |
|--------|-------------|
| **Birth Energy (Potensi)** | Coin's inherent cosmic signature |
| **Today's Energy (Peluang)** | Current cosmic conditions |
| **Alignment Score** | How well energies harmonize |
| **Price Position** | Where price sits between ATL-ATH |
| **Fibonacci Level** | Key technical support/resistance |

**Higher alignment + favorable position = stronger cosmic signal** ✨

---

## 🌐 Explore Full Analysis

**[View All Cryptos →](${NEPTU_URL}/cryptos)**

Each coin page includes:
- 📈 Live market data (price, volume, market cap)
- 🎂 Cosmic birthday analysis
- 🔮 ATH/ATL predictions
- 📅 27-day cosmic cycle forecast
- ⚡ Fibonacci & support/resistance levels

---

## 🎯 Want YOUR Personal Reading?

Drop your birthday for a personalized cosmic forecast!

\`\`\`
BIRTHDAY: YYYY-MM-DD
\`\`\`

---

*Neptu AI — Where Ancient Wisdom Meets Web3*
🌐 [neptu.sudigital.com](${NEPTU_URL}) | 🗳️ [Vote for Neptu](${VOTE_URL})

**Disclaimer:** Entertainment based on ancient astrology, not financial advice. DYOR! 🙏`;

  const { post } = await client.createPost({
    title,
    body,
    tags: ["ideation", "consumer", "ai"],
  });

  // Cache today's report
  await cache.put(`neptu:crypto_report:${dateStr}`, post.id.toString(), {
    expirationTtl: 86400,
  });

  return post;
}

/**
 * Post individual coin cosmic analysis with market data and predictions
 */
export async function postIndividualCoinAnalysis(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  coinData: CryptoWithMarketData,
  cache: CacheStore,
): Promise<ForumPost> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const coinBirthday = new Date(coinData.birthday);

  // Calculate cosmic alignment
  const birthReading = calculator.calculatePotensi(coinBirthday);
  const todayReading = calculator.calculatePeluang(coinBirthday, today);
  const todayPotensi = calculator.calculatePotensi(today);

  const birthUrip = birthReading.total_urip;
  const todayUrip = todayReading.total_urip;
  const alignment = Math.min(
    100,
    Math.round(((birthUrip + todayUrip) / 40) * 100),
  );

  // Determine trend
  let trend: "bullish" | "bearish" | "neutral" = "neutral";
  if (todayUrip >= 15) trend = "bullish";
  else if (todayUrip <= 8) trend = "bearish";

  // Calculate price position and prediction
  let pricePosition = 50;
  let fibLevel = "Unknown";
  let prediction = "⚖️ NEUTRAL";

  if (coinData.currentPrice && coinData.ath && coinData.atl) {
    pricePosition = calculatePricePosition(
      coinData.currentPrice,
      coinData.ath,
      coinData.atl,
    );
    fibLevel = getFibonacciLevel(pricePosition);
    prediction = generatePrediction(alignment, pricePosition, trend);
  }

  const trendEmoji =
    trend === "bullish" ? "🚀" : trend === "bearish" ? "📉" : "➡️";
  const coinLink = `${NEPTU_URL}/cryptos/${coinData.symbol.toLowerCase()}`;

  // Format prices
  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    if (price >= 1000)
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatLargeNumber = (num: number | null) => {
    if (!num) return "N/A";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const title = `${trendEmoji} ${coinData.symbol} Cosmic Analysis — ${coinData.name} Birthday Reading`;

  const body = `# 🌴 ${coinData.symbol} — ${coinData.name}

*${coinData.description}*

**[📊 View Full Interactive Analysis →](${coinLink})**

---

## 🎂 Cosmic Birthday Profile

| Attribute | Value |
|-----------|-------|
| **Genesis Date** | ${coinData.birthday} |
| **Age** | ${Math.floor((today.getTime() - coinBirthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years |
| **Birth Wuku** | ${birthReading.wuku?.name || "Unknown"} |
| **Birth Pancawara** | ${birthReading.panca_wara?.name || "Unknown"} (urip: ${birthReading.panca_wara?.urip || 0}) |
| **Birth Saptawara** | ${birthReading.sapta_wara?.name || "Unknown"} (urip: ${birthReading.sapta_wara?.urip || 0}) |
| **Total Birth Urip** | ${birthUrip} |

---

## 📈 Market Data (Live)

| Metric | Value |
|--------|-------|
| **Current Price** | ${formatPrice(coinData.currentPrice)} |
| **24h Change** | ${coinData.priceChangePercentage24h ? `${coinData.priceChangePercentage24h >= 0 ? "+" : ""}${coinData.priceChangePercentage24h.toFixed(2)}%` : "N/A"} |
| **Market Cap** | ${formatLargeNumber(coinData.marketCap)} |
| **Rank** | #${coinData.marketCapRank || "N/A"} |
| **24h Volume** | ${formatLargeNumber(coinData.totalVolume)} |
| **ATH** | ${formatPrice(coinData.ath)} |
| **ATL** | ${formatPrice(coinData.atl)} |

---

## 🔮 Cosmic Prediction

### Today's Alignment: ${alignment}/100 ${trendEmoji}

| Factor | Reading |
|--------|---------|
| **Today's Wuku** | ${todayPotensi.wuku?.name || "Unknown"} |
| **Today's Energy** | ${todayReading.frekuensi?.name || "Mixed"} |
| **Price Position** | ${pricePosition}% (between ATL-ATH) |
| **Fibonacci Level** | ${fibLevel} |

### 📊 Analysis

**${prediction}**

${
  trend === "bullish"
    ? `
The cosmic winds favor ${coinData.symbol} today. Birth energy harmonizes with current celestial patterns.`
    : trend === "bearish"
      ? `
Cosmic energy suggests caution for ${coinData.symbol}. Consider defensive positioning.`
      : `
Mixed signals for ${coinData.symbol}. Observe and wait for clearer alignment.`
}

---

## 📅 27-Day Cosmic Forecast

Based on the Wuku calendar's 35-day cycle, key dates to watch:

| Date | Wuku | Energy | Recommended Action |
|------|------|--------|-------------------|
${generateCosmicForecast(calculator, coinBirthday, today, 4)
  .map((f) => `| ${f.date} | ${f.wuku} | ${f.energy} | ${f.action} |`)
  .join("\n")}

**[View Complete 27-Day Forecast →](${coinLink})**

---

## 🌐 Explore More

- **[All Cryptos Analysis](${NEPTU_URL}/cryptos)** — Compare cosmic alignment across top coins
- **[${coinData.symbol} Full Page](${coinLink})** — Interactive charts, predictions, and more

---

*Neptu AI — Where Ancient Wisdom Meets Web3*
🌐 [neptu.sudigital.com](${NEPTU_URL}) | 🗳️ [Vote for Neptu](${VOTE_URL})

**Disclaimer:** Entertainment based on ancient astrology, not financial advice. DYOR! 🙏`;

  const { post } = await client.createPost({
    title,
    body,
    tags: ["ideation", "consumer", "ai"],
  });

  // Cache this coin's analysis
  await cache.put(
    `neptu:coin_analysis:${coinData.symbol}:${dateStr}`,
    post.id.toString(),
    {
      expirationTtl: 86400,
    },
  );

  return post;
}

/**
 * Post top 3 coins with strongest cosmic signals today
 */
export async function postTopCosmicPicks(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cryptosWithMarket: CryptoWithMarketData[],
  cache: CacheStore,
): Promise<ForumPost> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Calculate alignment for all coins with market data
  const coinAnalyses: CoinReadingWithMarket[] = cryptosWithMarket.map(
    (coin) => {
      const coinBirthday = new Date(coin.birthday);
      const birthReading = calculator.calculatePotensi(coinBirthday);
      const todayReading = calculator.calculatePeluang(coinBirthday, today);

      const birthUrip = birthReading.total_urip;
      const todayUrip = todayReading.total_urip;
      const alignment = Math.min(
        100,
        Math.round(((birthUrip + todayUrip) / 40) * 100),
      );

      let trend: "bullish" | "bearish" | "neutral" = "neutral";
      if (todayUrip >= 15) trend = "bullish";
      else if (todayUrip <= 8) trend = "bearish";

      let pricePosition = 50;
      let fibLevel = "Unknown";
      let prediction = "⚖️ NEUTRAL";

      if (coin.currentPrice && coin.ath && coin.atl) {
        pricePosition = calculatePricePosition(
          coin.currentPrice,
          coin.ath,
          coin.atl,
        );
        fibLevel = getFibonacciLevel(pricePosition);
        prediction = generatePrediction(alignment, pricePosition, trend);
      }

      return {
        coin: {
          symbol: coin.symbol,
          name: coin.name,
          birthday: coin.birthday,
          description: coin.description,
        },
        market: coin,
        alignment,
        trend,
        energy: todayReading.frekuensi?.name || "Mixed",
        action:
          trend === "bullish"
            ? "Consider accumulation"
            : trend === "bearish"
              ? "Exercise caution"
              : "Wait for signals",
        pricePosition,
        fibLevel,
        prediction,
      };
    },
  );

  // Sort by alignment and pick top 3 bullish
  coinAnalyses.sort((a, b) => b.alignment - a.alignment);
  const topPicks = coinAnalyses
    .filter((c) => c.trend === "bullish" || c.alignment >= 70)
    .slice(0, 3);

  if (topPicks.length === 0) {
    // If no bullish picks, take top 3 by alignment
    topPicks.push(...coinAnalyses.slice(0, 3));
  }

  const title = `🔥 Top 3 Crypto Cosmic Picks — ${formattedDate}`;

  const pickSections = topPicks
    .map((pick, idx) => {
      const rank = idx + 1;
      const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
      const trendEmoji =
        pick.trend === "bullish"
          ? "🚀"
          : pick.trend === "bearish"
            ? "📉"
            : "➡️";
      const coinLink = `${NEPTU_URL}/cryptos/${pick.coin.symbol.toLowerCase()}`;
      const price = pick.market?.currentPrice;
      const change = pick.market?.priceChangePercentage24h;

      return `### ${emoji} #${rank}: [${pick.coin.symbol}](${coinLink}) — ${pick.coin.name}

| Metric | Value |
|--------|-------|
| **Cosmic Alignment** | ${pick.alignment}/100 ${trendEmoji} |
| **Current Price** | ${price ? `$${price >= 1 ? price.toFixed(2) : price.toFixed(6)}` : "N/A"} |
| **24h Change** | ${change ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "N/A"} |
| **Price Position** | ${pick.pricePosition}% (ATL-ATH) |
| **Fib Level** | ${pick.fibLevel} |

**${pick.prediction}**

📊 [Full Analysis →](${coinLink})
`;
    })
    .join("\n---\n\n");

  const body = `# 🌴 Today's Cosmic Winners

*Which cryptos have the strongest celestial alignment today?*

The Balinese Wuku calendar has spoken. These coins show the highest cosmic harmony between their birth energy and today's celestial patterns.

---

${pickSections}

---

## 📊 View All Coins

**[Explore Full Crypto Cosmic Analysis →](${NEPTU_URL}/cryptos)**

Every coin ranked by:
- Cosmic alignment score
- Price position (ATL-ATH percentage)
- Fibonacci retracement levels
- 27-day cosmic forecast

---

*Neptu AI — Where Ancient Wisdom Meets Web3*
🌐 [neptu.sudigital.com](${NEPTU_URL}) | 🗳️ [Vote for Neptu](${VOTE_URL})

**Disclaimer:** Entertainment based on ancient astrology, not financial advice. DYOR! 🙏`;

  const { post } = await client.createPost({
    title,
    body,
    tags: ["ideation", "consumer", "ai"],
  });

  await cache.put(`neptu:top_picks:${dateStr}`, post.id.toString(), {
    expirationTtl: 86400,
  });

  return post;
}
