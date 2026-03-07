import type { PersonDTO } from "@neptu/drizzle-orm";
import type { MarketAsset } from "@neptu/shared";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  SENTIMENT_CONFIG,
  MARKET_CATEGORY_CONFIG,
  TOPIC_TO_CRYPTO_MAP,
} from "@neptu/shared";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ExternalLink,
  Flame,
  LineChart,
  Minus,
  Newspaper,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import { SuggestedPersons } from "./market-add-person";
import { MarketChartTab, TRADEABLE_SYMBOLS } from "./market-chart";
import {
  analyzeTopic,
  findRelatedPersons,
  formatTimeAgo,
  getSentimentColor,
  getSentimentLabel,
  type MatchedPerson,
  type TopicNeptuAnalysis,
} from "./market-parts";
import { MarketSentimentTab } from "./market-sentiment";

/* ── Constants ───────────────────────────────────────── */

const GOOD_SCORE_THRESHOLD = 60;
const MEDIUM_SCORE_THRESHOLD = 40;
const GOOD_SCORE_COLOR = "#22c55e";
const MEDIUM_SCORE_COLOR = "#eab308";
const LOW_SCORE_COLOR = "#ef4444";

/* ── Tiny components ─────────────────────────────────── */

function getScoreColor(score: number): string {
  if (score >= GOOD_SCORE_THRESHOLD) return GOOD_SCORE_COLOR;
  if (score >= MEDIUM_SCORE_THRESHOLD) return MEDIUM_SCORE_COLOR;
  return LOW_SCORE_COLOR;
}

function getSentimentBgClass(sentiment: string): string {
  if (sentiment === "bullish") return "bg-green-500/10";
  if (sentiment === "bearish") return "bg-red-500/10";
  return "bg-yellow-500/10";
}

function getSentimentIconComponent(sentiment: string): typeof TrendingUp {
  if (sentiment === "bullish") return TrendingUp;
  if (sentiment === "bearish") return TrendingDown;
  return Minus;
}

function getSignalIcon(signal: string, color: string): React.ReactNode {
  if (signal === "strong_buy" || signal === "buy") {
    return <CheckCircle2 className="h-4 w-4" style={{ color }} />;
  }
  if (signal === "sell" || signal === "strong_sell") {
    return <XCircle className="h-4 w-4" style={{ color }} />;
  }
  return <AlertTriangle className="h-4 w-4" style={{ color }} />;
}

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  strong_buy:
    "Cosmic alignment strongly favors this asset. Daily energy and prosperity indicators suggest a positive investment window.",
  buy: "Favorable cosmic conditions detected. Energy readings suggest moderate upside potential in the current cycle.",
  neutral:
    "Mixed celestial signals. Consider holding current positions and waiting for clearer cosmic alignment.",
  sell: "Cosmic energy is declining for this asset. Consider reducing exposure or setting tighter stop-losses.",
  strong_sell:
    "Strong warning signals from the cosmic realm. High caution advised — consider exiting or hedging positions.",
};

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-xs font-semibold"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function SentimentIcon({ sentiment }: { sentiment: string }) {
  const config = SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG];
  if (!config) return <Minus className="h-4 w-4" />;

  const Icon = getSentimentIconComponent(sentiment);

  return <Icon className="h-4 w-4" style={{ color: config.color }} />;
}

/* ── Analysis Tab ────────────────────────────────────── */

function AnalysisTab({
  topic,
  analysis,
  fetchedAt,
}: {
  topic: MarketAsset;
  analysis: TopicNeptuAnalysis;
  fetchedAt: string;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Market Overview</h3>
        </div>
        <div className="space-y-0.5 rounded-md border p-3">
          <StatRow label="Topic" value={topic.topic} />
          <StatRow
            label="Sentiment"
            value={getSentimentLabel(topic.sentiment)}
            color={getSentimentColor(topic.sentiment)}
          />
          <StatRow label="Article Mentions" value={topic.count} />
          <StatRow label="Fetched" value={formatTimeAgo(fetchedAt)} />
          {topic.categories && topic.categories.length > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Categories</span>
              <div className="flex flex-wrap gap-1">
                {topic.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px]"
                    style={{
                      backgroundColor: `${MARKET_CATEGORY_CONFIG[cat]?.color}15`,
                      color: MARKET_CATEGORY_CONFIG[cat]?.color,
                    }}
                  >
                    {MARKET_CATEGORY_CONFIG[cat]?.label ?? cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {topic.source && <StatRow label="Source" value={topic.source} />}
          {analysis.relatedCoin && (
            <StatRow label="Related Coin" value={analysis.relatedCoin} />
          )}
          {analysis.coinBirthday && (
            <StatRow label="Coin Birthday" value={analysis.coinBirthday} />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Neptu Cosmic Analysis</h3>
        </div>
        <div className="space-y-0.5 rounded-md border p-3">
          <StatRow
            label="Overall Score"
            value={`${analysis.overallScore}/100`}
            color={analysis.investmentColor}
          />
          <div className="py-1">
            <Progress value={analysis.overallScore} className="h-2" />
          </div>
          <StatRow
            label="Daily Energy"
            value={`${analysis.dailyEnergyScore}/100`}
          />
          <StatRow
            label="Cosmic Alignment"
            value={`${analysis.cosmicAlignmentScore}/100`}
          />
          <StatRow
            label="Prosperity Level"
            value={`${analysis.prosperityLevel} — ${analysis.prosperityLabel}`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {getSignalIcon(analysis.investmentSignal, analysis.investmentColor)}
          <h3 className="text-sm font-semibold">Investment Signal</h3>
        </div>
        <div
          className="rounded-md border p-4"
          style={{ borderColor: analysis.investmentColor }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-lg font-bold"
              style={{ color: analysis.investmentColor }}
            >
              {analysis.investmentLabel}
            </span>
            <Badge
              variant="outline"
              style={{
                borderColor: analysis.investmentColor,
                color: analysis.investmentColor,
              }}
            >
              Score: {analysis.overallScore}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {SIGNAL_DESCRIPTIONS[analysis.investmentSignal] ??
              SIGNAL_DESCRIPTIONS.neutral}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Recent Headlines</h3>
        </div>
        <div className="space-y-2">
          {topic.recentHeadlines.map((headline, i) => (
            <div
              key={`headline-${topic.topic}-${i}`}
              className="rounded-md border p-3 text-xs text-muted-foreground"
            >
              {headline}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Neptu Persons Tab ───────────────────────────────── */

function NeptuPersonsTab({
  matches,
  topic,
  persons,
  onPersonAdded,
}: {
  matches: MatchedPerson[];
  topic: MarketAsset;
  persons: PersonDTO[];
  onPersonAdded: () => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <User className="mb-2 h-8 w-8" />
          <p className="text-sm">No related persons found in the database</p>
          <p className="text-xs">
            Add persons detected from headlines below to calculate Neptu data
          </p>
        </div>

        <SuggestedPersons
          topic={topic}
          existingPersons={persons}
          onPersonAdded={onPersonAdded}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match.person.id} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={match.person.thumbnailUrl ?? undefined} />
              <AvatarFallback>
                {match.person.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {match.person.name}
                </span>
                {match.person.wikipediaUrl && (
                  <a
                    href={match.person.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {match.person.title ??
                  match.person.industries?.join(", ") ??
                  ""}
              </p>
            </div>
            <div className="text-right">
              <div
                className="text-sm font-bold"
                style={{ color: getScoreColor(match.neptuScore) }}
              >
                {match.neptuScore}
              </div>
              <div className="text-[10px] text-muted-foreground">Neptu</div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs font-semibold">
                {match.prosperityLevel}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Prosperity
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold">
                {match.prosperityLabel}
              </div>
              <div className="text-[10px] text-muted-foreground">Level</div>
            </div>
            <div>
              <div className="text-xs font-semibold">
                {Math.round(match.relevanceScore)}
              </div>
              <div className="text-[10px] text-muted-foreground">Relevance</div>
            </div>
          </div>

          {match.person.netWorthBillions && (
            <div className="text-xs text-muted-foreground">
              <Flame className="mr-1 inline h-3 w-3" />
              Net Worth: ${match.person.netWorthBillions.toFixed(1)}B
            </div>
          )}
        </div>
      ))}

      <SuggestedPersons
        topic={topic}
        existingPersons={persons}
        onPersonAdded={onPersonAdded}
      />
    </div>
  );
}

/* ── Detail Sheet ────────────────────────────────────── */

interface MarketDetailSheetProps {
  topic: MarketAsset | null;
  fetchedAt: string;
  persons: PersonDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonAdded: () => void;
}

export function MarketDetailSheet({
  topic,
  fetchedAt,
  persons,
  open,
  onOpenChange,
  onPersonAdded,
}: MarketDetailSheetProps) {
  if (!topic) return null;

  const analysis = analyzeTopic(topic, fetchedAt);
  const relatedPersons = findRelatedPersons(topic, persons);

  const symbol = TOPIC_TO_CRYPTO_MAP[topic.topic];
  const isCrypto = !!symbol && TRADEABLE_SYMBOLS.has(symbol);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-6 sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                getSentimentBgClass(topic.sentiment)
              )}
            >
              <SentimentIcon sentiment={topic.sentiment} />
            </div>
            <div>
              <SheetTitle>{topic.topic}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getSentimentColor(topic.sentiment),
                    color: getSentimentColor(topic.sentiment),
                  }}
                >
                  {getSentimentLabel(topic.sentiment)}
                </Badge>
                <span>{topic.count} mentions</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="analysis">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="market">
                {isCrypto ? (
                  <span className="flex items-center gap-1">
                    <LineChart className="h-3 w-3" />
                    Market
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Sentiment
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="neptu">
                Neptu ({relatedPersons.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4">
              <AnalysisTab
                topic={topic}
                analysis={analysis}
                fetchedAt={fetchedAt}
              />
            </TabsContent>

            <TabsContent value="market" className="mt-4">
              {isCrypto ? (
                <MarketChartTab topic={topic} />
              ) : (
                <MarketSentimentTab topic={topic} />
              )}
            </TabsContent>

            <TabsContent value="neptu" className="mt-4">
              <NeptuPersonsTab
                matches={relatedPersons}
                topic={topic}
                persons={persons}
                onPersonAdded={onPersonAdded}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
