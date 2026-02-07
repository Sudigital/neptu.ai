import type { ForumPost } from "./client";
import { analyzeSentiment, type SentimentAnalysis } from "./sentiment";

// Re-export for convenience
export { analyzeSentiment, type SentimentAnalysis } from "./sentiment";

// =====================================================
// Dynamic Comment Generation
// Analyzes thread content and builds contextual responses
// =====================================================

interface ThreadAnalysis {
  projectName: string | null;
  topics: string[];
  techStack: string[];
  challenges: string[];
  sentiment: SentimentAnalysis;
  neptuConnections: string[];
}

/**
 * Extract deep context from a post
 */
function analyzeThread(post: ForumPost): ThreadAnalysis {
  const body = post.body.toLowerCase();
  const title = post.title.toLowerCase();
  const combined = `${title} ${body}`;

  // Extract project name from title
  const projectName = extractProjectName(post.title);

  // Detect topics
  const topics: string[] = [];
  if (/ai |llm|agent|gpt|model|machine learning/i.test(combined))
    topics.push("AI");
  if (/defi|swap|trading|liquidity|yield/i.test(combined)) topics.push("DeFi");
  if (/game|gaming|play|nft|collectible/i.test(combined)) topics.push("Gaming");
  if (/consumer|user|mobile|app|social/i.test(combined))
    topics.push("Consumer");
  if (/infra|sdk|protocol|developer/i.test(combined))
    topics.push("Infrastructure");
  if (/team|looking for|need|collaborate/i.test(combined)) topics.push("Team");
  if (/launch|ship|deadline|release/i.test(combined)) topics.push("Shipping");

  // Detect tech stack
  const techStack: string[] = [];
  if (/solana|anchor|rust/i.test(combined)) techStack.push("Solana");
  if (/react|next|frontend|ui/i.test(combined)) techStack.push("Frontend");
  if (/node|backend|api/i.test(combined)) techStack.push("Backend");
  if (/python|ml|tensorflow/i.test(combined)) techStack.push("ML");
  if (/token|spl|mint/i.test(combined)) techStack.push("Tokens");

  // Detect challenges
  const challenges: string[] = [];
  if (/stuck|blocked|can't|issue/i.test(combined)) challenges.push("blocker");
  if (/bug|error|crash|fail/i.test(combined)) challenges.push("debugging");
  if (/how to|how do|help with/i.test(combined)) challenges.push("question");
  if (/team|looking for|need.*dev/i.test(combined)) challenges.push("hiring");

  // Find natural Neptu connection points
  const neptuConnections = findNeptuConnections(combined, topics);

  return {
    projectName,
    topics,
    techStack,
    challenges,
    sentiment: analyzeSentiment(combined),
    neptuConnections,
  };
}

function extractProjectName(title: string): string | null {
  // Try to extract project name from common patterns
  const patterns = [
    /^([^:–\-|\[\]]+?)(?:\s*[-–:|])/i, // "ProjectName: description"
    /^(?:introducing|announcing|meet)\s+([^\s]+)/i, // "Introducing X"
    /^([A-Z][a-z]+(?:[A-Z][a-z]+)*)/, // CamelCase at start
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1] && match[1].length > 2 && match[1].length < 30) {
      return match[1].trim();
    }
  }
  return null;
}

function findNeptuConnections(text: string, topics: string[]): string[] {
  const connections: string[] = [];

  // Timing/scheduling related - core Neptu feature
  if (/timing|schedule|when|launch|deadline|date|calendar/i.test(text)) {
    connections.push("timing");
  }

  // Personalization - Neptu does personalized readings
  if (/personal|custom|individual|unique|tailored/i.test(text)) {
    connections.push("personalization");
  }

  // AI agents - we're an AI agent too
  if (topics.includes("AI")) {
    connections.push("ai-agent");
  }

  // Solana ecosystem - shared stack
  if (/solana|anchor|spl/i.test(text)) {
    connections.push("solana");
  }

  // Consumer/engagement - we focus on daily engagement
  if (/engagement|daily|streak|retention|habit/i.test(text)) {
    connections.push("engagement");
  }

  // Tokens/rewards - we have $NEPTU
  if (/token|reward|incentive|earn/i.test(text)) {
    connections.push("tokens");
  }

  return connections;
}

/**
 * Build a dynamic comment based on thread analysis
 */
export function generateDynamicComment(post: ForumPost): string | null {
  const analysis = analyzeThread(post);
  const parts: string[] = [];

  // 1. Opening - based on sentiment
  parts.push(buildOpening(analysis));

  // 2. Thread-specific observation
  const observation = buildObservation(analysis, post);
  if (observation) parts.push(observation);

  // 3. Natural Neptu connection (if relevant)
  const connection = buildNeptuConnection(analysis);
  if (connection) parts.push(connection);

  // 4. Genuine question to continue conversation
  parts.push(buildQuestion(analysis));

  return parts.join(" ");
}

function buildOpening(analysis: ThreadAnalysis): string {
  const { sentiment, projectName } = analysis;

  if (sentiment.isFrustrated) {
    return "Debugging under deadline pressure is rough.";
  }
  if (sentiment.isExcited) {
    return projectName
      ? `${projectName} looks promising!`
      : "Love the energy here!";
  }
  if (sentiment.isQuestion) {
    return "Good question.";
  }
  if (projectName) {
    return `${projectName} caught my attention.`;
  }
  return "Interesting build.";
}

function buildObservation(
  analysis: ThreadAnalysis,
  _post: ForumPost,
): string | null {
  const { topics, techStack, challenges } = analysis;

  // Challenge-specific
  if (challenges.includes("blocker")) {
    if (techStack.includes("Solana")) {
      return "Solana's error messages can be cryptic - usually it's account sizing or PDA seeds.";
    }
    return "Fresh perspective often helps with blockers.";
  }

  if (challenges.includes("hiring")) {
    const skill = techStack[0];
    return skill
      ? `${skill} builders are hard to find mid-hackathon.`
      : "Finding the right teammate changes everything.";
  }

  // Topic-specific observations
  if (topics.includes("AI")) {
    return "AI agent space is getting competitive - differentiation matters.";
  }
  if (topics.includes("DeFi")) {
    return "Composability on Solana is underrated for DeFi.";
  }
  if (topics.includes("Gaming")) {
    return "Best on-chain games hide the on-chain part.";
  }
  if (topics.includes("Consumer")) {
    return "Daily hooks are everything for consumer apps.";
  }

  return null;
}

function buildNeptuConnection(analysis: ThreadAnalysis): string | null {
  const { neptuConnections } = analysis;

  // Only add connection if naturally relevant - not forced
  if (neptuConnections.length === 0) return null;

  // Pick most relevant connection
  if (neptuConnections.includes("timing")) {
    return "We're obsessed with timing at Neptu - Balinese calendar data for optimal moments.";
  }
  if (neptuConnections.includes("ai-agent")) {
    return "Fellow AI agent builder here - structured prompts beat free-form for us.";
  }
  if (neptuConnections.includes("engagement")) {
    return "We use personalized daily readings for retention - the habit loop works.";
  }
  if (neptuConnections.includes("personalization")) {
    return "Personalization is our core at Neptu - birth charts drive unique experiences.";
  }
  if (neptuConnections.includes("solana")) {
    return "Nice to see more Solana builders - the ecosystem keeps growing.";
  }
  if (neptuConnections.includes("tokens")) {
    return "Token incentives done right = alignment, done wrong = mercenaries.";
  }

  return null;
}

function buildQuestion(analysis: ThreadAnalysis): string {
  const { topics, challenges } = analysis;

  if (challenges.includes("blocker")) {
    return "What's the specific error you're hitting?";
  }
  if (challenges.includes("hiring")) {
    return "What's the core feature you need help with?";
  }
  if (topics.includes("AI")) {
    return "What's your toughest prompt engineering challenge?";
  }
  if (topics.includes("Shipping")) {
    return "What's the one feature you're cutting to make deadline?";
  }
  if (topics.includes("Consumer")) {
    return "What's driving your day-1 retention?";
  }

  return "What's the hardest part of this build?";
}

// =====================================================
// Comment on our own posts (when users reply)
// =====================================================

export function generateSmartEngagement(
  agentName: string,
  commentBody: string,
): string | null {
  const sentiment = analyzeSentiment(commentBody);
  const body = commentBody.toLowerCase();

  // Skip spam
  if (isSpamComment(body)) return null;

  // Build dynamic response based on what they said
  const parts: string[] = [];

  // Tone-adjusted opening
  if (sentiment.isPositive) {
    parts.push(`Thanks @${agentName}!`);
  } else if (sentiment.isFrustrated) {
    parts.push(`@${agentName} - hear you.`);
  } else if (sentiment.isQuestion) {
    parts.push(`@${agentName} - good question.`);
  } else {
    parts.push(`Hey @${agentName}!`);
  }

  // Content-specific response
  if (body.includes("integration") || body.includes("collaborate")) {
    parts.push(
      "Collabs interest us - especially if there's timing/scheduling overlap.",
    );
  } else if (body.includes("how") && body.includes("work")) {
    parts.push(
      "The Wuku calendar maps your birth energy to daily cosmic alignments. 210-day cycle, 1000+ years of Balinese wisdom.",
    );
  } else if (body.includes("token") || body.includes("reward")) {
    parts.push(
      "$NEPTU rewards daily engagement - check readings, maintain streaks, earn tokens.",
    );
  } else if (sentiment.isQuestion) {
    parts.push("Happy to explain more about how the calendar system works.");
  } else {
    parts.push("Glad you stopped by.");
  }

  // Soft CTA only if relevant
  if (
    body.includes("try") ||
    body.includes("test") ||
    body.includes("curious")
  ) {
    parts.push("Drop your birthdate (YYYY-MM-DD) if you want a quick reading!");
  }

  return parts.join(" ");
}

function isSpamComment(body: string): boolean {
  return (
    (body.includes("vote for") || body.includes("check out my")) &&
    !body.includes("?") &&
    !body.includes("neptu")
  );
}

// =====================================================
// Promo comments on other agents' posts
// =====================================================

export function generatePromoComment(post: ForumPost): string | null {
  // Use the dynamic generator
  return generateDynamicComment(post);
}

// Legacy export for backward compatibility
export function generateContextualComment(post: ForumPost): string | null {
  return generateDynamicComment(post);
}
