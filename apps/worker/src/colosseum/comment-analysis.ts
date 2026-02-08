/** Thread analysis engine for comment generation */
import type { ForumPost } from "./client";
import { analyzeSentiment, type SentimentAnalysis } from "./sentiment";

export interface ThreadAnalysis {
  projectName: string | null;
  topics: string[];
  techStack: string[];
  challenges: string[];
  sentiment: SentimentAnalysis;
  neptuConnections: string[];
  keyPhrases: string[];
  specificContent: string | null;
  postId: number;
}

// Track commented posts to avoid duplicates - uses post ID
export const commentedPostIds = new Set<number>();

/**
 * Extract deep context from a post - including specific content
 */
export function analyzeThread(post: ForumPost): ThreadAnalysis {
  const body = post.body.toLowerCase();
  const title = post.title.toLowerCase();
  const combined = `${title} ${body}`;

  const projectName = extractProjectName(post.title);
  const keyPhrases = extractKeyPhrases(post.body);
  const specificContent = extractSpecificContent(post.body);

  // Detect topics - expanded list
  const topics: string[] = [];
  if (/ai |llm|agent|gpt|model|machine learning|neural/i.test(combined))
    topics.push("AI");
  if (/defi|swap|trading|liquidity|yield|amm|dex/i.test(combined))
    topics.push("DeFi");
  if (/game|gaming|play|nft|collectible|pvp|rpg/i.test(combined))
    topics.push("Gaming");
  if (/consumer|user|mobile|app|social|community/i.test(combined))
    topics.push("Consumer");
  if (/infra|sdk|protocol|developer|tooling|api/i.test(combined))
    topics.push("Infrastructure");
  if (/team|looking for|need|collaborate|partner/i.test(combined))
    topics.push("Team");
  if (/launch|ship|deadline|release|mvp|demo/i.test(combined))
    topics.push("Shipping");
  if (/timing|schedule|when to|best time|optimal/i.test(combined))
    topics.push("Timing");
  if (/engage|retention|daily|streak|habit|loop/i.test(combined))
    topics.push("Engagement");
  if (/predict|forecast|future|trend|insight/i.test(combined))
    topics.push("Prediction");
  if (/personal|custom|individual|unique|tailored/i.test(combined))
    topics.push("Personalization");
  if (/vote|voting|community|dao|governance/i.test(combined))
    topics.push("Governance");

  // Detect tech stack
  const techStack: string[] = [];
  if (/solana|anchor|rust|spl/i.test(combined)) techStack.push("Solana");
  if (/react|next|frontend|ui|ux/i.test(combined)) techStack.push("Frontend");
  if (/node|backend|api|server/i.test(combined)) techStack.push("Backend");
  if (/python|ml|tensorflow|pytorch/i.test(combined)) techStack.push("ML");
  if (/token|spl|mint|burn/i.test(combined)) techStack.push("Tokens");

  // Detect challenges
  const challenges: string[] = [];
  if (/stuck|blocked|can't|issue|problem/i.test(combined))
    challenges.push("blocker");
  if (/bug|error|crash|fail|broken/i.test(combined))
    challenges.push("debugging");
  if (/how to|how do|help with|\?/i.test(combined)) challenges.push("question");
  if (/team|looking for|need.*dev|hiring/i.test(combined))
    challenges.push("hiring");
  if (/scale|performance|speed|optimize/i.test(combined))
    challenges.push("scaling");

  const neptuConnections = findNeptuConnections(combined, topics);

  return {
    projectName,
    topics,
    techStack,
    challenges,
    sentiment: analyzeSentiment(combined),
    neptuConnections,
    keyPhrases,
    specificContent,
    postId: post.id,
  };
}

/**
 * Extract unique key phrases from the post that we can reference
 */
export function extractKeyPhrases(body: string): string[] {
  const phrases: string[] = [];

  const quotes = body.match(/"([^"]+)"/g);
  if (quotes) {
    phrases.push(...quotes.slice(0, 3).map((q) => q.replace(/"/g, "")));
  }

  const bullets = body.match(/[-•]\s*([^\n]+)/g);
  if (bullets) {
    phrases.push(
      ...bullets.slice(0, 3).map((b) => b.replace(/[-•]\s*/, "").trim()),
    );
  }

  const features = body.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
  if (features) {
    phrases.push(...features.slice(0, 3));
  }

  const bold = body.match(/\*\*([^*]+)\*\*/g);
  if (bold) {
    phrases.push(...bold.slice(0, 2).map((b) => b.replace(/\*\*/g, "")));
  }

  return phrases.filter((p) => p.length > 3 && p.length < 50);
}

/**
 * Extract specific numbers, stats, or unique details
 */
export function extractSpecificContent(body: string): string | null {
  const percent = body.match(/\d+(?:\.\d+)?%/);
  if (percent) return percent[0];

  const money = body.match(/\$\d+(?:\.\d+)?[KMB]?/);
  if (money) return money[0];

  const users = body.match(/\d+(?:,\d+)*\s*(?:users?|customers?|wallets?)/i);
  if (users) return users[0];

  const timeframe = body.match(/\d+\s*(?:days?|weeks?|months?|hours?)/i);
  if (timeframe) return timeframe[0];

  return null;
}

export function extractProjectName(title: string): string | null {
  const patterns = [
    /^([^:–\-|\[\]]+?)(?:\s*[-–:|])/i,
    /^(?:introducing|announcing|meet)\s+([^\s]+)/i,
    /^([A-Z][a-z]+(?:[A-Z][a-z]+)*)/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1] && match[1].length > 2 && match[1].length < 30) {
      return match[1].trim();
    }
  }
  return null;
}

export function findNeptuConnections(text: string, topics: string[]): string[] {
  const connections: string[] = [];

  if (
    /timing|schedule|when|launch|deadline|date|calendar|optimal|moment/i.test(
      text,
    )
  ) {
    connections.push("timing");
  }

  if (/personal|custom|individual|unique|tailored|for you/i.test(text)) {
    connections.push("personalization");
  }

  if (topics.includes("AI")) {
    connections.push("ai-agent");
  }

  if (/solana|anchor|spl/i.test(text)) {
    connections.push("solana");
  }

  if (/engagement|daily|streak|retention|habit|loop|hook/i.test(text)) {
    connections.push("engagement");
  }

  if (/token|reward|incentive|earn|burn|deflationary/i.test(text)) {
    connections.push("tokens");
  }

  if (/decision|choose|pick|select|best|which/i.test(text)) {
    connections.push("decision");
  }

  if (/match|team|partner|compatible|fit|cofounder/i.test(text)) {
    connections.push("compatibility");
  }

  if (/predict|forecast|future|trend|insight|foresee/i.test(text)) {
    connections.push("prediction");
  }

  if (/culture|spiritual|wisdom|ancient|tradition|mindful/i.test(text)) {
    connections.push("cultural");
  }

  return connections;
}

/**
 * Variation selector - uses post ID for consistent but unique selection
 */
export function pickVariation<T>(
  options: T[],
  postId: number,
  offset: number = 0,
): T {
  const index = (postId + offset) % options.length;
  return options[index];
}
