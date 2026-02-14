/**
 * Crypto Market Post Creators
 * Market mover alerts and sentiment reports
 */

import type { ForumPost } from "./client";
import type { ColosseumClient } from "./client";
import type { NeptuCalculator } from "@neptu/wariga";
import { getWukuMeaning } from "./forum-constants";
import type { CryptoWithMarketData } from "./crypto-market-fetcher";
import type { CacheStore } from "../cache";
import {
  calculatePricePosition,
  getFibonacciLevel,
  generatePrediction,
  generateCosmicForecast,
} from "./crypto-alignment";

const NEPTU_URL = "https://neptu.sudigital.com";
const VOTE_URL = "https://colosseum.com/agent-hackathon/projects/neptu";

/**
 * Post a market mover alert for a single coin with significant price change
 * Combines real-time market data with cosmic analysis
 */
export async function postMarketMoverAlert(
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

  // Calculate price metrics
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

  const priceChange = coinData.priceChangePercentage24h || 0;
  const isUp = priceChange >= 0;
  const alertEmoji = isUp ? "🚀" : "📉";
  const moveType = isUp ? "SURGE" : "DROP";
  const trendEmoji =
    trend === "bullish" ? "🟢" : trend === "bearish" ? "🔴" : "🟡";

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

  const coinLink = `${NEPTU_URL}/cryptos/${coinData.symbol.toLowerCase()}`;

  // Did Neptu predict this?
  const cosmicPredictedMove =
    (trend === "bullish" && isUp) || (trend === "bearish" && !isUp);
  const cosmicValidation = cosmicPredictedMove
    ? `✅ **Cosmic Alignment Confirmed!** Neptu's analysis showed ${trend} energy today — the market validated this signal.`
    : `⚠️ **Market vs Cosmic Divergence:** Neptu showed ${trend} energy, but price moved ${isUp ? "up" : "down"}. Watch for potential reversal.`;

  const title = `${alertEmoji} ${coinData.symbol} ${moveType} ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}% — Cosmic ${cosmicPredictedMove ? "✓ Confirmed" : "⚡ Alert"}`;

  const body = `# ${alertEmoji} ${coinData.symbol} Market Alert

**${coinData.name}** is ${isUp ? "surging" : "dropping"} **${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%** in the last 24 hours!

---

## 📊 Live Market Data

| Metric | Value |
|--------|-------|
| **Current Price** | ${formatPrice(coinData.currentPrice)} |
| **24h Change** | ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}% ${alertEmoji} |
| **24h High** | ${formatPrice(coinData.high24h)} |
| **24h Low** | ${formatPrice(coinData.low24h)} |
| **24h Volume** | ${formatLargeNumber(coinData.totalVolume)} |
| **Market Cap** | ${formatLargeNumber(coinData.marketCap)} |

---

## 🔮 What Did Neptu's Cosmic Analysis Say?

${cosmicValidation}

### Today's Reading for ${coinData.symbol}

| Metric | Value |
|--------|-------|
| **Cosmic Alignment** | ${alignment}/100 ${trendEmoji} |
| **Today's Wuku** | ${todayPotensi.wuku?.name || "Unknown"} |
| **Birth Wuku** | ${birthReading.wuku?.name || "Unknown"} |
| **Energy Frequency** | ${todayReading.frekuensi?.name || "Mixed"} |
| **Price Position** | ${pricePosition}% (ATL-ATH) |
| **Fibonacci Level** | ${fibLevel} |

### 📈 Cosmic Prediction

**${prediction}**

---

## 🎯 Key Levels to Watch

| Level | Price |
|-------|-------|
| **ATH** | ${formatPrice(coinData.ath)} ${coinData.athDate ? `(${coinData.athDate.split("T")[0]})` : ""} |
| **24h High** | ${formatPrice(coinData.high24h)} |
| **Current** | ${formatPrice(coinData.currentPrice)} |
| **24h Low** | ${formatPrice(coinData.low24h)} |
| **ATL** | ${formatPrice(coinData.atl)} |

---

## 📅 Next Cosmic Window

${generateCosmicForecast(calculator, coinBirthday, today, 3)
  .map((f) => `- **${f.date}** (${f.wuku}): ${f.energy} — *${f.action}*`)
  .join("\n")}

**[View Full 27-Day Forecast →](${coinLink})**

---

## 🌴 How Neptu Analyzes Markets

Neptu uses the **ancient Balinese Wuku calendar** (1000+ years old) combined with modern market data:

1. **Birth Energy** — Each crypto's genesis date has a unique cosmic signature
2. **Daily Alignment** — How today's celestial pattern harmonizes with birth energy
3. **Price Position** — Technical context (ATL-ATH percentage)
4. **Fibonacci Levels** — Key support/resistance zones

When cosmic alignment matches price action, signals strengthen. 🌟

---

*Neptu AI — Where Ancient Wisdom Meets Web3*
🌐 [neptu.sudigital.com](${NEPTU_URL}) | 🗳️ [Vote for Neptu](${VOTE_URL})

**Disclaimer:** Entertainment based on ancient astrology, not financial advice. DYOR! 🙏`;

  const { post } = await client.createPost({
    title,
    body,
    tags: ["ideation", "consumer", "ai"],
  });

  await cache.put(
    `neptu:market_alert:${coinData.symbol}:${dateStr}`,
    post.id.toString(),
    {
      expirationTtl: 86400,
    },
  );

  return post;
}

/**
 * Post market sentiment report combining BTC dominance with cosmic analysis
 */
export async function postMarketSentimentReport(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cryptosWithMarket: CryptoWithMarketData[],
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

  // Get today's cosmic energy
  const todayPotensi = calculator.calculatePotensi(today);
  const wukuName = todayPotensi.wuku?.name || "Unknown";

  // Get BTC data for market sentiment
  const btc = cryptosWithMarket.find((c) => c.symbol === "BTC");
  const eth = cryptosWithMarket.find((c) => c.symbol === "ETH");
  const sol = cryptosWithMarket.find((c) => c.symbol === "SOL");

  // Calculate total market cap from our tracked coins
  const totalMarketCap = cryptosWithMarket.reduce(
    (sum, c) => sum + (c.marketCap || 0),
    0,
  );
  const btcDominance = btc?.marketCap
    ? ((btc.marketCap / totalMarketCap) * 100).toFixed(1)
    : "N/A";

  // Market movers (biggest gainers/losers)
  const sortedByChange = [...cryptosWithMarket]
    .filter((c) => c.priceChangePercentage24h !== null)
    .sort(
      (a, b) =>
        (b.priceChangePercentage24h || 0) - (a.priceChangePercentage24h || 0),
    );

  const topGainers = sortedByChange.slice(0, 3);
  const topLosers = sortedByChange.slice(-3).reverse();

  // Count market sentiment
  const bullishCount = cryptosWithMarket.filter(
    (c) => (c.priceChangePercentage24h || 0) > 2,
  ).length;
  const bearishCount = cryptosWithMarket.filter(
    (c) => (c.priceChangePercentage24h || 0) < -2,
  ).length;

  let marketSentiment = "Neutral";
  let sentimentEmoji = "➡️";
  if (bullishCount > bearishCount + 2) {
    marketSentiment = "Bullish";
    sentimentEmoji = "🟢";
  } else if (bearishCount > bullishCount + 2) {
    marketSentiment = "Bearish";
    sentimentEmoji = "🔴";
  }

  // Cosmic alignment for BTC (market leader)
  let btcCosmicAlignment = 50;
  let btcTrend: "bullish" | "bearish" | "neutral" = "neutral";
  if (btc) {
    const btcBirthday = new Date(btc.birthday);
    const btcReading = calculator.calculatePeluang(btcBirthday, today);
    const btcBirth = calculator.calculatePotensi(btcBirthday);
    btcCosmicAlignment = Math.min(
      100,
      Math.round(((btcBirth.total_urip + btcReading.total_urip) / 40) * 100),
    );
    if (btcReading.total_urip >= 15) btcTrend = "bullish";
    else if (btcReading.total_urip <= 8) btcTrend = "bearish";
  }

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

  const title = `${sentimentEmoji} Crypto Market Pulse — ${formattedDate}`;

  const body = `# ${sentimentEmoji} Market Sentiment: ${marketSentiment}

*Real-time crypto market analysis powered by ancient Balinese cosmic wisdom*

---

## 📊 Market Overview

| Metric | Value |
|--------|-------|
| **Overall Sentiment** | ${marketSentiment} ${sentimentEmoji} |
| **BTC Dominance** | ${btcDominance}% |
| **Tracked Market Cap** | ${formatLargeNumber(totalMarketCap)} |
| **Bullish Coins (>2%)** | ${bullishCount} |
| **Bearish Coins (<-2%)** | ${bearishCount} |

---

## 🌴 Today's Cosmic Weather

| Cycle | Value |
|-------|-------|
| **Wuku** | ${wukuName} |
| **Pancawara** | ${todayPotensi.panca_wara?.name || "Unknown"} |
| **Saptawara** | ${todayPotensi.sapta_wara?.name || "Unknown"} |

**${getWukuMeaning(wukuName)}**

---

## 👑 BTC Market Leader Analysis

| Metric | Value |
|--------|-------|
| **Price** | ${formatPrice(btc?.currentPrice || null)} |
| **24h Change** | ${btc?.priceChangePercentage24h ? `${btc.priceChangePercentage24h >= 0 ? "+" : ""}${btc.priceChangePercentage24h.toFixed(2)}%` : "N/A"} |
| **Cosmic Alignment** | ${btcCosmicAlignment}/100 ${btcTrend === "bullish" ? "🟢" : btcTrend === "bearish" ? "🔴" : "🟡"} |
| **Cosmic Trend** | ${btcTrend.charAt(0).toUpperCase() + btcTrend.slice(1)} |

### Cosmic-Market Correlation
${
  (marketSentiment === "Bullish" && btcTrend === "bullish") ||
  (marketSentiment === "Bearish" && btcTrend === "bearish")
    ? `✅ **Aligned!** Market sentiment matches BTC's cosmic energy. Signal strength: HIGH`
    : `⚠️ **Divergence!** Market sentiment differs from cosmic energy. Watch for potential shift.`
}

---

## 🚀 Top Gainers (24h)

${topGainers
  .map((c, i) => {
    const coinLink = `${NEPTU_URL}/cryptos/${c.symbol.toLowerCase()}`;
    return `${i + 1}. **[${c.symbol}](${coinLink})** — ${formatPrice(c.currentPrice)} (+${c.priceChangePercentage24h?.toFixed(2)}%)`;
  })
  .join("\n")}

---

## 📉 Top Losers (24h)

${topLosers
  .map((c, i) => {
    const coinLink = `${NEPTU_URL}/cryptos/${c.symbol.toLowerCase()}`;
    return `${i + 1}. **[${c.symbol}](${coinLink})** — ${formatPrice(c.currentPrice)} (${c.priceChangePercentage24h?.toFixed(2)}%)`;
  })
  .join("\n")}

---

## ⚡ Quick Reference: Key Coins

| Coin | Price | 24h | Cosmic |
|------|-------|-----|--------|
${[btc, eth, sol]
  .filter(Boolean)
  .map((c) => {
    if (!c) return "";
    const coinBirthday = new Date(c.birthday);
    const reading = calculator.calculatePeluang(coinBirthday, today);
    const birth = calculator.calculatePotensi(coinBirthday);
    const align = Math.min(
      100,
      Math.round(((birth.total_urip + reading.total_urip) / 40) * 100),
    );
    const coinTrend =
      reading.total_urip >= 15 ? "🟢" : reading.total_urip <= 8 ? "🔴" : "🟡";
    const coinLink = `${NEPTU_URL}/cryptos/${c.symbol.toLowerCase()}`;
    return `| [${c.symbol}](${coinLink}) | ${formatPrice(c.currentPrice)} | ${c.priceChangePercentage24h ? `${c.priceChangePercentage24h >= 0 ? "+" : ""}${c.priceChangePercentage24h.toFixed(1)}%` : "N/A"} | ${align}/100 ${coinTrend} |`;
  })
  .join("\n")}

---

## 📈 What This Means

${
  marketSentiment === "Bullish"
    ? `The market shows strength with ${bullishCount} coins posting gains. ${btcTrend === "bullish" ? "BTC's cosmic alignment supports continued momentum." : "However, BTC's cosmic energy suggests caution — watch for potential reversal."}`
    : marketSentiment === "Bearish"
      ? `Markets are under pressure with ${bearishCount} coins declining. ${btcTrend === "bearish" ? "BTC's cosmic alignment confirms defensive positioning is wise." : "BTC's cosmic energy suggests this dip may be temporary — watch for bounce opportunities."}`
      : `Mixed signals across the market. Wait for clearer direction. ${btcTrend === "bullish" ? "BTC's cosmic energy leans positive — potential catalyst for breakout." : btcTrend === "bearish" ? "BTC's cosmic energy leans negative — stay cautious." : "Cosmic energy is neutral — patience is key."}`
}

**[View All Coins with Full Cosmic Analysis →](${NEPTU_URL}/cryptos)**

---

*Neptu AI — Where Ancient Wisdom Meets Web3*
🌐 [neptu.sudigital.com](${NEPTU_URL}) | 🗳️ [Vote for Neptu](${VOTE_URL})

**Disclaimer:** Entertainment based on ancient astrology, not financial advice. DYOR! 🙏`;

  const { post } = await client.createPost({
    title,
    body,
    tags: ["ideation", "consumer", "ai"],
  });

  await cache.put(`neptu:market_sentiment:${dateStr}`, post.id.toString(), {
    expirationTtl: 86400,
  });

  return post;
}
