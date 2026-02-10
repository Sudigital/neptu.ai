/**
 * Reply Generator for Neptu Forum Agent
 * Generates contextual replies to comments on our threads.
 */

import type { ForumAgent } from "./forum-agent";

const SITE_URL = "https://neptu.sudigital.com";

/**
 * Generate a contextual reply to a comment on our thread.
 */
export function generateReply(
  forumAgent: ForumAgent,
  agentName: string,
  commentBody: string,
  postTitle: string,
): string {
  const body = commentBody.toLowerCase();

  // Birthday request
  const birthdayMatch = body.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
  if (birthdayMatch) {
    try {
      const reading = forumAgent.generatePeluangReading(birthdayMatch[1]);
      return (
        `🌊 **Hey ${agentName}!** Thanks for sharing your birthday!\n\n${reading}\n\n` +
        `Check out your full cosmic profile at [neptu.sudigital.com](${SITE_URL}) 🐚`
      );
    } catch {
      // Invalid date, fall through to general reply
    }
  }

  // Appreciation / thanks
  if (
    /thank|thanks|thx|amazing|great|awesome|cool|love|nice|impressive|good/i.test(
      body,
    )
  ) {
    return pickRandom([
      `Thank you ${agentName}! 🌊 Your support means a lot. Neptu blends ancient Balinese Wuku wisdom with modern crypto — it's been an incredible journey building this.\n\nIf you'd like a personalized reading, just reply with your birthday in YYYY-MM-DD format! 🐚`,
      `Appreciate the kind words ${agentName}! 🙏 We're pushing the boundaries of what cosmic AI can do for crypto.\n\nCurious about your cosmic crypto profile? Drop your birthday (YYYY-MM-DD) and I'll generate one! ⭐`,
      `Thanks so much ${agentName}! 🌺 Glad you're vibing with Neptu. Ancient wisdom meets modern markets — that's our thing.\n\nWant to see your personal Wuku reading? Share your birthday (YYYY-MM-DD)! 🔮`,
    ]);
  }

  // Question about project
  if (/how|what|why|when|where|can|does|could|explain|tell me/i.test(body)) {
    return (
      `Great question ${agentName}! 🌊\n\n` +
      `Neptu uses the ancient Balinese Pawukon (Wuku) calendar system — a 210-day cycle with 30 unique weeks — to generate cosmic insights for crypto markets. Each Wuku week carries distinct energetic signatures that we map to market behavior patterns.\n\n` +
      `Try it yourself at [neptu.sudigital.com](${SITE_URL}) — enter any crypto's "birthday" (listing date) to see its cosmic profile!\n\n` +
      `Feel free to ask more — I love talking about this intersection of ancient wisdom and modern tech 🐚`
    );
  }

  // Collaboration / team
  if (/collab|team|partner|together|join|integrate|build/i.test(body)) {
    return (
      `Hey ${agentName}! 🤝 Always open to collaboration!\n\n` +
      `Neptu's Wuku-based analysis could complement a lot of crypto tools — cosmic timing for trading, personalized insights, unique NFT traits based on birth cycles, and more.\n\n` +
      `Check out our project at [neptu.sudigital.com](${SITE_URL}) and let's explore what we could build together! 🌊`
    );
  }

  // Default: engaging, relevant reply
  return pickRandom([
    `Hey ${agentName}! 🌊 Thanks for engaging with "${postTitle.slice(0, 50)}"!\n\nNeptu brings ancient Balinese Wuku calendar wisdom into the crypto space — personalized cosmic readings, market insights, and on-chain engagement.\n\nCurious about your crypto cosmic profile? Share your birthday (YYYY-MM-DD) and I'll generate one! 🐚`,
    `Appreciate you joining the conversation ${agentName}! 🌺\n\nNeptu combines 1000+ years of Balinese calendar tradition with modern AI to offer unique crypto insights. Every date has its own cosmic energy pattern.\n\nWant a reading? Drop your birthday (YYYY-MM-DD)! 🔮`,
    `Thanks for your thoughts ${agentName}! 🙏\n\nAt Neptu, we believe ancient wisdom and blockchain technology are a perfect match. The Wuku calendar has guided Balinese life for centuries — now it guides crypto decisions.\n\nTry it: share your birthday (YYYY-MM-DD) for a personalized reading! 🌊`,
  ]);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
