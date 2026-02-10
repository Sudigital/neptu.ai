/**
 * Reply Generator for Neptu Forum Agent
 * Generates contextual, meaningful replies to comments on our threads.
 *
 * QUALITY GUIDELINES (skill.md v1.6.1):
 * - Give value first — engage with what the commenter actually said
 * - Leave meaningful comments, not self-promotional templates
 * - Only mention Neptu when genuinely relevant
 * - No "Drop your birthday" in every reply
 */

import type { ForumAgent } from "./forum-agent";

const SITE_URL = "https://neptu.sudigital.com";

/**
 * Generate a contextual reply to a comment on our thread.
 * Focuses on genuine engagement over self-promotion.
 */
export function generateReply(
  forumAgent: ForumAgent,
  agentName: string,
  commentBody: string,
  _postTitle: string,
): string {
  const body = commentBody.toLowerCase();

  // Birthday request — the one case where birthday CTA is appropriate
  const birthdayMatch = body.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
  if (birthdayMatch) {
    try {
      const reading = forumAgent.generatePeluangReading(birthdayMatch[1]);
      return (
        `🌊 Hey ${agentName}! Thanks for sharing your birthday!\n\n${reading}\n\n` +
        `Full cosmic profile at [neptu.sudigital.com](${SITE_URL}) 🐚`
      );
    } catch {
      // Invalid date, fall through
    }
  }

  // Technical question about how Neptu works
  if (
    /how|what|why|explain|tell me/i.test(body) &&
    /wuku|calendar|cosmic|oracle|reading|neptu|works/i.test(body)
  ) {
    return (
      `Good question ${agentName}! 🌊\n\n` +
      `The Wuku calendar is a 210-day cycle from Bali with 30 unique weeks, each carrying distinct energetic signatures. ` +
      `We map these cycles to crypto market patterns — not prediction, but pattern recognition across 1000+ years of cultural data.\n\n` +
      `The AI Oracle layer interprets these patterns in context of your question. Try it at [neptu.sudigital.com](${SITE_URL}) if you're curious!`
    );
  }

  // Collaboration / partnership offer
  if (/collab|team|partner|together|join|integrate|build with/i.test(body)) {
    return (
      `Hey ${agentName}! 🤝 Always open to collaboration.\n\n` +
      `What kind of integration are you thinking? Neptu's Wuku analysis could complement timing-sensitive features, personalization layers, or cultural data APIs. ` +
      `Let's explore what makes sense for both sides.`
    );
  }

  // Genuine questions (not about Neptu specifically)
  if (/\?/.test(commentBody) || /how|what|why|when|could|can you/i.test(body)) {
    return pickRandom([
      `Good question ${agentName}! ${getContextualAnswer(body)}`,
      `${agentName} — that's worth thinking about. ${getContextualAnswer(body)}`,
      `Appreciate you asking ${agentName}. ${getContextualAnswer(body)}`,
    ]);
  }

  // Criticism or skepticism
  if (/skeptic|doubt|not sure|disagree|concern|risk|problem/i.test(body)) {
    return (
      `Fair point ${agentName}. Healthy skepticism makes projects better. ` +
      `${getRelevantResponse(body)} ` +
      `What would you want to see to feel more confident about this approach?`
    );
  }

  // Appreciation / thanks — keep it brief, no spam CTAs
  if (
    /thank|thanks|thx|amazing|great|awesome|cool|love|nice|impressive|good/i.test(
      body,
    )
  ) {
    return pickRandom([
      `Appreciate that ${agentName}! 🙏 Glad it resonates.`,
      `Thanks ${agentName}! Means a lot to hear that.`,
      `${agentName} — thank you! Always good to know the work connects.`,
    ]);
  }

  // Substantive comment — engage with what they actually said
  return pickRandom([
    `Interesting perspective ${agentName}. ${getRelevantResponse(body)}`,
    `Good point ${agentName}. ${getRelevantResponse(body)}`,
    `${agentName} — appreciate you adding to the discussion. ${getRelevantResponse(body)}`,
  ]);
}

/**
 * Generate a contextual answer based on what the commenter is asking about
 */
function getContextualAnswer(body: string): string {
  if (/price|market|bull|bear|pump|dump/i.test(body)) {
    return "Market cycles are complex — the Wuku system adds a pattern-recognition lens, not price targets. It's about identifying energy windows, not making promises.";
  }
  if (/token|reward|earn|stake/i.test(body)) {
    return "$NEPTU rewards daily engagement with the platform — readings, streaks, and oracle interactions. The economics are designed to be sustainable with 50% burn on utility spend.";
  }
  if (/solana|on-chain|blockchain|smart contract/i.test(body)) {
    return "We chose Solana for speed and low fees — cosmic readings need to feel instant, and micro-rewards need to be gas-efficient.";
  }
  if (/ai|llm|model|prompt|agent/i.test(body)) {
    return "The AI Oracle uses the Wuku calendar as structured context — it grounds the LLM output in a real system rather than letting it hallucinate freely. Constraints improve quality.";
  }
  if (/team|hackathon|build|ship/i.test(body)) {
    return "Building solo but moving fast — the cultural data is the moat, the tech is the delivery mechanism. Shipping is everything in a 10-day hackathon.";
  }
  return "That's a good angle to explore. Would love to hear more about your thinking on this.";
}

/**
 * Generate a relevant response based on comment content
 */
function getRelevantResponse(body: string): string {
  if (/interesting|unique|different|creative/i.test(body)) {
    return "The cultural preservation angle is what drives the project — Bali's Wuku system has guided decisions for centuries, and we think blockchain is the right way to keep that wisdom accessible.";
  }
  if (/useful|practical|real|utility/i.test(body)) {
    return "That's the goal — utility over hype. The readings and market analysis are tools, not toys.";
  }
  if (/compete|other|versus|compared/i.test(body)) {
    return "Every project here brings something different. We're focused on doing the cultural-data-meets-AI niche well rather than competing broadly.";
  }
  if (/future|plan|after|next/i.test(body)) {
    return "Post-hackathon plans include deeper Wuku cycle mapping, more indigenous knowledge systems, and mainnet deployment with real economic loops.";
  }
  return "The intersection of ancient systems and modern tech keeps surprising us with how well it works.";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
