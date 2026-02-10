/** Comment part builders — opening, observation, feature offer, question */
import type { ForumPost } from "./client";
import { type ThreadAnalysis, pickVariation } from "./comment-analysis";

/**
 * Build a unique opening based on specific post content
 */
export function buildUniqueOpening(
  analysis: ThreadAnalysis,
  post: ForumPost,
): string {
  const { sentiment, projectName, keyPhrases, specificContent, postId } =
    analysis;

  // Priority 1: Use specific stats/numbers from the post
  if (specificContent) {
    const statOpenings = [
      `Thanks for sharing this! The ${specificContent} stat is impressive.`,
      `Great post! ${specificContent} - that's a compelling metric.`,
      `Really interesting to see ${specificContent} here.`,
      `Appreciate the transparency! ${specificContent} is solid data.`,
    ];
    return pickVariation(statOpenings, postId);
  }

  // Priority 2: Reference actual content from the post
  if (keyPhrases.length > 0) {
    const phrase = keyPhrases[0].slice(0, 25);
    const phraseOpenings = [
      `Thanks for sharing this perspective! "${phrase}" really resonates.`,
      `Great insights! The "${phrase}" angle is clever.`,
      `Love what you're doing here! "${phrase}" stands out.`,
      `Appreciate this post! "${phrase}" - solid thinking.`,
    ];
    return pickVariation(phraseOpenings, postId);
  }

  // Priority 3: Project name reference
  if (projectName) {
    const nameOpenings = [
      `Thanks for sharing ${projectName}! This caught my attention.`,
      `Great work on ${projectName}! Been watching the progress.`,
      `${projectName} looks promising! Thanks for the update.`,
      `Interesting angle with ${projectName}! Appreciate the transparency.`,
      `${projectName} - unique approach here! Thanks for sharing.`,
    ];
    return pickVariation(nameOpenings, postId);
  }

  // Priority 4: Sentiment-based
  if (sentiment.isFrustrated) {
    const frustratedOpenings = [
      "Feel this - debugging under deadline pressure is rough.",
      "Appreciate you sharing this! Hitting walls is part of the process.",
      "Thanks for being real about this - the grind is hard.",
      "Relatable! Blockers always show up at the worst time.",
    ];
    return pickVariation(frustratedOpenings, postId);
  }

  if (sentiment.isExcited) {
    const excitedOpenings = [
      "Love the energy here! Thanks for sharing!",
      "This enthusiasm is contagious! Great update.",
      "The excitement shows - that's a good sign!",
      "This momentum is what wins hackathons! Thanks for posting.",
    ];
    return pickVariation(excitedOpenings, postId);
  }

  if (sentiment.isQuestion) {
    const questionOpenings = [
      "Great question to raise!",
      "Thanks for asking this - worth thinking about.",
      "Smart to bring this up now!",
      "Appreciate you starting this discussion!",
    ];
    return pickVariation(questionOpenings, postId);
  }

  // Fallback: Use title words for uniqueness
  const titleWords = post.title.split(" ").slice(0, 4).join(" ");
  const fallbackOpenings = [
    `Thanks for sharing this! "${titleWords}" - interesting approach.`,
    `Appreciate the post! "${titleWords}" is worth discussing.`,
    `Great topic! "${titleWords}" - adding my thoughts.`,
  ];
  return pickVariation(fallbackOpenings, postId);
}

/**
 * Build a topic/challenge-specific observation
 */
export function buildSpecificObservation(
  analysis: ThreadAnalysis,
  _post: ForumPost,
): string | null {
  const { topics, techStack, challenges, keyPhrases, postId } = analysis;

  if (keyPhrases.length > 1) {
    const phrase = keyPhrases[1].slice(0, 20);
    const featureObs = [
      `The ${phrase} approach could differentiate you.`,
      `${phrase} is where you'll stand out.`,
      `Smart to focus on ${phrase}.`,
      `${phrase} - this is the moat.`,
    ];
    return pickVariation(featureObs, postId);
  }

  if (challenges.includes("blocker")) {
    if (techStack.includes("Solana")) {
      const solanaBlockers = [
        "Solana's error messages can be cryptic - usually it's account sizing or PDA seeds.",
        "Check the account data size - Solana fails silently on overflow.",
        "PDA derivation gotchas are common - double check your seeds.",
        "Anchor's error codes map to specific issues - worth decoding.",
      ];
      return pickVariation(solanaBlockers, postId);
    }
    const blockerObs = [
      "Fresh perspective often helps with blockers.",
      "Sometimes stepping back reveals the obvious fix.",
      "Rubber duck debugging works - explain it out loud.",
      "The solution is usually simpler than the bug suggests.",
    ];
    return pickVariation(blockerObs, postId);
  }

  if (challenges.includes("debugging")) {
    const debugObs = [
      "Logs are your friend - add more than you think you need.",
      "Isolate the issue first - then fix.",
      "Reproducing reliably is half the battle.",
    ];
    return pickVariation(debugObs, postId);
  }

  if (challenges.includes("hiring")) {
    const hiringObs = [
      "Finding the right teammate changes everything.",
      "Skills matter less than alignment during hackathons.",
      "One committed builder beats three distracted ones.",
      `${techStack[0] || "Good"} builders are in demand - offer equity of learning.`,
    ];
    return pickVariation(hiringObs, postId);
  }

  if (challenges.includes("scaling")) {
    const scalingObs = [
      "Premature optimization is the enemy - ship first.",
      "Scale problems are good problems to have.",
      "Solana handles the scale - focus on the product.",
    ];
    return pickVariation(scalingObs, postId);
  }

  if (topics.includes("AI")) {
    const aiObs = [
      "AI agent space is getting competitive - differentiation matters.",
      "The agent-to-agent interaction patterns here could be powerful.",
      "Seen a lot of AI agents - yours has a unique angle.",
      "Structured data constraints actually improve AI outputs.",
      "The prompting strategy will make or break this.",
      "Agent memory and context handling is the hard part.",
    ];
    return pickVariation(aiObs, postId);
  }

  if (topics.includes("DeFi")) {
    const defiObs = [
      "Composability on Solana is underrated for DeFi.",
      "The liquidity bootstrapping approach is clever.",
      "DeFi + UX simplification = mass adoption path.",
      "Anchor makes DeFi primitives almost too easy.",
      "The yield mechanics need to be sustainable post-incentives.",
    ];
    return pickVariation(defiObs, postId);
  }

  if (topics.includes("Gaming")) {
    const gamingObs = [
      "Best on-chain games hide the on-chain part.",
      "Fun first, blockchain second - this is the way.",
      "Session keys solve the UX problem for games.",
      "The reward loop matters more than the tech stack.",
    ];
    return pickVariation(gamingObs, postId);
  }

  if (topics.includes("Consumer")) {
    const consumerObs = [
      "Daily hooks are everything for consumer apps.",
      "Consumer apps that feel native win.",
      "The habit loop design here is solid.",
      "Distribution is the hard part - tech is solved.",
      "Retention beats acquisition every time.",
      "The first 7 days determine lifetime value.",
    ];
    return pickVariation(consumerObs, postId);
  }

  if (topics.includes("Infrastructure")) {
    const infraObs = [
      "Infra plays are long-term bets - respect.",
      "Developer experience is the moat.",
      "The best infra is invisible to users.",
      "Documentation quality predicts adoption.",
    ];
    return pickVariation(infraObs, postId);
  }

  if (topics.includes("Timing")) {
    const timingObs = [
      "Timing optimization is something we obsess over at Neptu.",
      "Launch timing can make a 3x difference in visibility.",
      "The Wuku calendar maps 210 days of energy cycles.",
    ];
    return pickVariation(timingObs, postId);
  }

  if (topics.includes("Engagement")) {
    const engagementObs = [
      "Engagement mechanics done right = organic growth.",
      "Streaks are powerful but need the right reward cadence.",
      "Daily rituals beat weekly sprints for retention.",
      "Personalized timing beats generic push notifications.",
    ];
    return pickVariation(engagementObs, postId);
  }

  if (topics.includes("Shipping")) {
    const shippingObs = [
      "Ship imperfect early > perfect late.",
      "Scope cutting is a superpower.",
      "The MVP should be embarrassingly minimal.",
      "Feedback from real users beats assumptions.",
    ];
    return pickVariation(shippingObs, postId);
  }

  return null;
}

/**
 * Build a brief, genuine Neptu connection based on post content.
 * NOT a sales pitch — just a one-sentence note about shared interests.
 * Only include when there's a real thematic overlap.
 */
export function buildNeptuConnection(
  analysis: ThreadAnalysis,
  _post: ForumPost,
): string | null {
  const { neptuConnections, postId } = analysis;

  if (neptuConnections.length === 0) return null;

  if (neptuConnections.includes("timing")) {
    const variants = [
      "We're exploring timing optimization at Neptu too — the Balinese Wuku calendar maps 210-day energy cycles that correlate with market patterns.",
      "Timing is something we obsess over — the Wuku calendar has 1000+ years of pattern data we're experimenting with.",
    ];
    return pickVariation(variants, postId);
  }

  if (neptuConnections.includes("ai-agent")) {
    const variants = [
      "Fellow AI agent builder — we've found that structured cultural data as context dramatically reduces hallucination in our Oracle.",
      "Working on similar challenges at Neptu. Structured constraints (we use Balinese calendar data) actually improve AI output quality.",
    ];
    return pickVariation(variants, postId);
  }

  if (neptuConnections.includes("engagement")) {
    const variants = [
      "Engagement mechanics are our focus too — daily personalized content drives better retention than generic notifications in our tests.",
      "We're iterating on similar loops — daily cosmic readings as ritual-based engagement. The streak mechanics really matter.",
    ];
    return pickVariation(variants, postId);
  }

  if (neptuConnections.includes("tokens")) {
    const variants = [
      "Interesting tokenomics thinking. We went with a deflationary burn model — 50% of utility spend gets burned.",
      "Token sustainability is key — we're testing earn-for-engagement with strong deflationary pressure to keep the economics honest.",
    ];
    return pickVariation(variants, postId);
  }

  if (neptuConnections.includes("cultural")) {
    const variants = [
      "Cultural preservation on-chain is close to our hearts — Neptu encodes the Balinese Wuku calendar system. Great to see others thinking about this space.",
      "Love seeing cultural-meets-blockchain projects. We're encoding 1000 years of Balinese calendar wisdom — the heritage preservation angle is underexplored.",
    ];
    return pickVariation(variants, postId);
  }

  if (neptuConnections.includes("personalization")) {
    const variants = [
      "Personalization is powerful — we use a single birth date to derive 30 data points from the Wuku system. Zero friction, high signal.",
      "The personalization angle resonates. Structured cultural data lets us personalize without collecting invasive user data.",
    ];
    return pickVariation(variants, postId);
  }

  if (neptuConnections.includes("solana")) {
    const variants = [
      "Good to see more Solana builders. The composability and speed have been great for our use case.",
      "Solana ecosystem keeps growing. The low fees make micro-reward mechanics actually viable.",
    ];
    return pickVariation(variants, postId);
  }

  // For less specific connections, skip — don't force it
  return null;
}

/**
 * Build a specific question based on post content
 */
export function buildSpecificQuestion(
  analysis: ThreadAnalysis,
  _post: ForumPost,
): string {
  const { topics, challenges, keyPhrases, projectName, postId } = analysis;

  if (keyPhrases.length > 0) {
    const phrase = keyPhrases[0].toLowerCase().slice(0, 20);
    const phraseQuestions = [
      `How did you approach the ${phrase} part?`,
      `What's the biggest challenge with ${phrase}?`,
      `Any learnings on the ${phrase} implementation?`,
    ];
    return pickVariation(phraseQuestions, postId);
  }

  if (challenges.includes("blocker")) {
    const blockerQs = [
      "What's the specific error you're hitting?",
      "Got a stack trace to share?",
      "What have you tried so far?",
    ];
    return pickVariation(blockerQs, postId);
  }

  if (challenges.includes("hiring")) {
    const hiringQs = [
      "What's the core feature you need help with?",
      "Remote-friendly or location-specific?",
      "What's the time commitment looking like?",
    ];
    return pickVariation(hiringQs, postId);
  }

  if (topics.includes("AI")) {
    const aiQs = projectName
      ? [
          `How does ${projectName} handle context length limits?`,
          `What's ${projectName}'s approach to agent memory?`,
        ]
      : [
          "How are you handling context window limits?",
          "What's the evaluation strategy for outputs?",
        ];
    return pickVariation(aiQs, postId);
  }

  if (topics.includes("DeFi")) {
    const defiQs = [
      "What's the liquidity bootstrapping strategy?",
      "How are you thinking about sustainable yields?",
      "What's the security audit timeline?",
    ];
    return pickVariation(defiQs, postId);
  }

  if (topics.includes("Gaming")) {
    const gamingQs = [
      "What's the core loop that keeps players coming back?",
      "How are you handling transaction signing UX?",
      "What's the player acquisition strategy?",
    ];
    return pickVariation(gamingQs, postId);
  }

  if (topics.includes("Shipping")) {
    const shippingQs = [
      "What's the one feature you're cutting to make deadline?",
      "When's the target ship date?",
      "What's the MVP scope?",
    ];
    return pickVariation(shippingQs, postId);
  }

  if (topics.includes("Consumer")) {
    const consumerQs = [
      "What's driving your day-1 retention?",
      "What's the daily active trigger?",
      "How are you thinking about distribution?",
    ];
    return pickVariation(consumerQs, postId);
  }

  if (topics.includes("Timing")) {
    const timingQs = [
      "Have you found specific time windows that work better?",
      "What data are you using for timing optimization?",
      "Any patterns in user engagement by time?",
    ];
    return pickVariation(timingQs, postId);
  }

  if (topics.includes("Engagement")) {
    const engagementQs = [
      "What's the streak mechanic look like?",
      "How do you handle streak breaks?",
      "What's the reward cadence?",
    ];
    return pickVariation(engagementQs, postId);
  }

  if (topics.includes("Team")) {
    const teamQs = [
      "What roles are you looking for?",
      "What's the equity/comp structure?",
      "How did the team form?",
    ];
    return pickVariation(teamQs, postId);
  }

  const fallbackQs = projectName
    ? [
        `What's the hardest part of building ${projectName}?`,
        `What's ${projectName}'s unfair advantage?`,
        `Where does ${projectName} go after the hackathon?`,
      ]
    : [
        "What's the hardest part of this build?",
        "What would you do differently starting over?",
        "What's the post-hackathon plan?",
      ];
  return pickVariation(fallbackQs, postId);
}
