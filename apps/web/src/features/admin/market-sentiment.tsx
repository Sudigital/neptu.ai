import type { MarketAsset } from "@neptu/shared";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SENTIMENT_CONFIG } from "@neptu/shared";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Brain,
  Flame,
  MessageSquare,
  Minus,
  TrendingUp,
} from "lucide-react";

/* ── Constants ───────────────────────────────────────── */

const FULL = 100;
const MAX_KEYWORDS = 8;
const HIGH_SENTIMENT_THRESHOLD = 60;
const MID_SENTIMENT_THRESHOLD = 40;
const HIGH_MOMENTUM = 15;
const MID_MOMENTUM = 8;
const SENTIMENT_WEIGHT = 0.4;
const MOMENTUM_WEIGHT = 0.3;
const HEADLINE_WEIGHT = 0.3;
const MOMENTUM_DIVISOR = 20;
const KEYWORD_MIN_LENGTH = 4;
const GAUGE_CX = 80;
const GAUGE_CY = 80;
const GAUGE_R = 60;
const GAUGE_NEEDLE_LEN = 50;
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "has",
  "its",
  "they",
  "been",
  "have",
  "from",
  "this",
  "that",
  "with",
  "will",
  "each",
  "make",
  "like",
  "into",
  "over",
  "such",
  "after",
  "could",
  "about",
  "than",
  "what",
  "when",
  "how",
  "new",
  "more",
  "also",
  "very",
  "just",
  "says",
  "said",
  "may",
  "most",
  "some",
  "amid",
  "now",
]);

const SENTIMENT_ZONES = [
  { min: 0, max: 20, label: "Very Bearish", color: "#ef4444" },
  { min: 21, max: 40, label: "Bearish", color: "#f97316" },
  { min: 41, max: 60, label: "Neutral", color: "#eab308" },
  { min: 61, max: 80, label: "Bullish", color: "#84cc16" },
  { min: 81, max: 100, label: "Very Bullish", color: "#22c55e" },
] as const;

/* ── Helpers ─────────────────────────────────────────── */

interface SentimentAnalysis {
  overallScore: number;
  sentimentLabel: string;
  sentimentColor: string;
  momentum: "rising" | "stable" | "declining";
  momentumScore: number;
  headlineCount: number;
  topKeywords: string[];
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  outlook: string;
}

const POSITIVE_WORDS = new Set([
  "surge",
  "rally",
  "soar",
  "gain",
  "breakthrough",
  "boom",
  "jump",
  "rise",
  "grow",
  "growth",
  "bullish",
  "profit",
  "win",
  "success",
  "positive",
  "advance",
  "approve",
  "approved",
  "adoption",
  "launch",
  "record",
  "high",
  "strong",
  "momentum",
  "upgrade",
  "partnership",
  "innovation",
  "revolutionary",
  "milestone",
  "recovery",
  "expand",
]);

const NEGATIVE_WORDS = new Set([
  "crash",
  "plunge",
  "drop",
  "fall",
  "decline",
  "bearish",
  "loss",
  "fear",
  "hack",
  "exploit",
  "vulnerability",
  "scam",
  "fraud",
  "ban",
  "restrict",
  "crackdown",
  "investigation",
  "lawsuit",
  "fine",
  "sink",
  "dump",
  "risk",
  "warning",
  "threat",
  "collapse",
  "bankrupt",
  "fail",
]);

function analyzeHeadlines(
  headlines: string[]
): SentimentAnalysis["sentimentBreakdown"] {
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const headline of headlines) {
    const words = headline.toLowerCase().split(/\s+/);
    let posCount = 0;
    let negCount = 0;
    for (const word of words) {
      const clean = word.replace(/[^a-z]/g, "");
      if (POSITIVE_WORDS.has(clean)) posCount++;
      if (NEGATIVE_WORDS.has(clean)) negCount++;
    }
    if (posCount > negCount) positive++;
    else if (negCount > posCount) negative++;
    else neutral++;
  }

  return { positive, negative, neutral };
}

function extractKeywords(headlines: string[], topicName: string): string[] {
  const freq: Record<string, number> = {};
  const topicLower = topicName.toLowerCase();

  for (const headline of headlines) {
    const words = headline.toLowerCase().split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^a-z]/g, "");
      if (
        clean.length >= KEYWORD_MIN_LENGTH &&
        !STOP_WORDS.has(clean) &&
        clean !== topicLower
      ) {
        freq[clean] = (freq[clean] ?? 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_KEYWORDS)
    .map(([word]) => word);
}

function computeSentiment(topic: MarketAsset): SentimentAnalysis {
  const breakdown = analyzeHeadlines(topic.recentHeadlines);
  const total = breakdown.positive + breakdown.negative + breakdown.neutral;
  const posRatio = total > 0 ? breakdown.positive / total : 0;

  const sentimentBase = SENTIMENT_CONFIG[topic.sentiment].weight;
  const sentimentScore = Math.round(
    ((sentimentBase + 1) / 2) * FULL * SENTIMENT_WEIGHT +
      posRatio * FULL * HEADLINE_WEIGHT +
      Math.min(topic.count / MOMENTUM_DIVISOR, 1) * FULL * MOMENTUM_WEIGHT
  );
  const overallScore = Math.max(0, Math.min(FULL, sentimentScore));

  const momentumScore = topic.count;
  let momentum: SentimentAnalysis["momentum"] = "stable";
  if (momentumScore >= HIGH_MOMENTUM) momentum = "rising";
  else if (momentumScore < MID_MOMENTUM) momentum = "declining";

  const zone =
    SENTIMENT_ZONES.find(
      (z) => overallScore >= z.min && overallScore <= z.max
    ) ?? SENTIMENT_ZONES[2];

  const topKeywords = extractKeywords(topic.recentHeadlines, topic.topic);

  let outlook: string;
  if (overallScore >= HIGH_SENTIMENT_THRESHOLD) {
    outlook = `${topic.topic} shows strong positive momentum with ${topic.count} mentions. Headlines lean positive with favorable market sentiment. Watch for continuation signals.`;
  } else if (overallScore >= MID_SENTIMENT_THRESHOLD) {
    outlook = `${topic.topic} has mixed signals with ${topic.count} mentions. Market sentiment is neutral — wait for clearer direction before forming a position.`;
  } else {
    outlook = `${topic.topic} is trending with concerning sentiment (${topic.count} mentions). Headlines lean negative. Exercise caution and monitor for reversal signals.`;
  }

  return {
    overallScore,
    sentimentLabel: zone.label,
    sentimentColor: zone.color,
    momentum,
    momentumScore,
    headlineCount: topic.recentHeadlines.length,
    topKeywords,
    sentimentBreakdown: breakdown,
    outlook,
  };
}

/* ── Mini Gauge ──────────────────────────────────────── */

function SentimentGauge({ score }: { score: number }) {
  const needleAngle = Math.PI - (score / FULL) * Math.PI;
  const nx = GAUGE_CX + GAUGE_NEEDLE_LEN * Math.cos(needleAngle);
  const ny = GAUGE_CY - GAUGE_NEEDLE_LEN * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 160 95" className="mx-auto w-full max-w-[160px]">
      {SENTIMENT_ZONES.map((zone) => {
        const s = Math.PI - (zone.min / FULL) * Math.PI;
        const e = Math.PI - (zone.max / FULL) * Math.PI;
        const x1 = GAUGE_CX + GAUGE_R * Math.cos(s);
        const y1 = GAUGE_CY - GAUGE_R * Math.sin(s);
        const x2 = GAUGE_CX + GAUGE_R * Math.cos(e);
        const y2 = GAUGE_CY - GAUGE_R * Math.sin(e);
        return (
          <path
            key={`${zone.min}-${zone.max}`}
            d={`M ${x1} ${y1} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke={zone.color}
            strokeWidth={8}
            strokeLinecap="butt"
          />
        );
      })}
      <line
        x1={GAUGE_CX}
        y1={GAUGE_CY}
        x2={nx}
        y2={ny}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={GAUGE_CX} cy={GAUGE_CY} r={2.5} fill="currentColor" />
    </svg>
  );
}

/* ── Main Export: MarketSentimentTab ────────────────── */

export function MarketSentimentTab({ topic }: { topic: MarketAsset }) {
  const analysis = computeSentiment(topic);
  const total =
    analysis.sentimentBreakdown.positive +
    analysis.sentimentBreakdown.negative +
    analysis.sentimentBreakdown.neutral;

  const posPercent =
    total > 0
      ? Math.round((analysis.sentimentBreakdown.positive / total) * FULL)
      : 0;
  const negPercent =
    total > 0
      ? Math.round((analysis.sentimentBreakdown.negative / total) * FULL)
      : 0;
  const neuPercent = FULL - posPercent - negPercent;

  const MOMENTUM_ICONS = {
    rising: ArrowUp,
    declining: ArrowDown,
    stable: Minus,
  } as const;
  const MOMENTUM_COLORS = {
    rising: "text-emerald-600",
    declining: "text-red-600",
    stable: "text-yellow-600",
  } as const;

  const MomentumIcon = MOMENTUM_ICONS[analysis.momentum];
  const momentumColor = MOMENTUM_COLORS[analysis.momentum];

  return (
    <div className="space-y-4">
      {/* Overall Sentiment Gauge */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Sentiment Score</h3>
        </div>
        <div className="flex flex-col items-center rounded-md border p-3">
          <SentimentGauge score={analysis.overallScore} />
          <div
            className="text-2xl font-bold"
            style={{ color: analysis.sentimentColor }}
          >
            {analysis.overallScore}
          </div>
          <div
            className="text-xs font-semibold"
            style={{ color: analysis.sentimentColor }}
          >
            {analysis.sentimentLabel}
          </div>
        </div>
      </div>

      {/* Headline Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Headline Sentiment</h3>
        </div>
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Analyzed {analysis.headlineCount} headlines
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">
                Positive ({analysis.sentimentBreakdown.positive})
              </span>
              <span className="text-xs font-semibold">{posPercent}%</span>
            </div>
            <Progress
              value={posPercent}
              className="h-1.5 [&>div]:bg-emerald-500"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">
                Negative ({analysis.sentimentBreakdown.negative})
              </span>
              <span className="text-xs font-semibold">{negPercent}%</span>
            </div>
            <Progress value={negPercent} className="h-1.5 [&>div]:bg-red-500" />

            <div className="flex items-center justify-between">
              <span className="text-xs text-yellow-600">
                Neutral ({analysis.sentimentBreakdown.neutral})
              </span>
              <span className="text-xs font-semibold">{neuPercent}%</span>
            </div>
            <Progress
              value={neuPercent}
              className="h-1.5 [&>div]:bg-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Momentum */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Topic Momentum</h3>
        </div>
        <div className="rounded-md border p-3">
          <div className="flex items-center gap-3">
            <MomentumIcon className={`h-5 w-5 ${momentumColor}`} />
            <div>
              <div className={`text-sm font-bold capitalize ${momentumColor}`}>
                {analysis.momentum}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {analysis.momentumScore} article mentions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {analysis.topKeywords.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Top Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.topKeywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="text-[10px]">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Outlook */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Outlook</h3>
        </div>
        <div
          className="rounded-md border p-3 text-xs text-muted-foreground"
          style={{ borderColor: analysis.sentimentColor }}
        >
          {analysis.outlook}
        </div>
      </div>
    </div>
  );
}
