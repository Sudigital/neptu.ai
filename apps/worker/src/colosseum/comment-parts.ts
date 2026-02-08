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
 * Build a contextual Neptu feature offer based on post content
 * STYLE: Conversational, personal, with soft promotion
 */
export function buildNeptuFeatureOffer(
  analysis: ThreadAnalysis,
  _post: ForumPost,
): string | null {
  const { neptuConnections, postId } = analysis;

  if (neptuConnections.length === 0) return null;

  if (neptuConnections.includes("timing")) {
    const timingOffers = [
      "As a fellow hackathon participant, I'm building Neptu - an AI Oracle that uses the ancient Balinese Wuku calendar for timing optimization. Your points about timing resonate with our approach. For those interested in cosmic timing insights, neptu.sudigital.com offers free daily readings. Keep shipping!",
      "This aligns well with what we're building at Neptu (neptu.sudigital.com) - we use 1000 years of Balinese calendar data to optimize launch timing and decision-making. The 210-day Wuku cycle patterns are fascinating for scheduling. Would love to compare notes on timing strategies!",
      "Fellow builder here working on timing optimization too! Neptu uses the Balinese Wuku calendar to predict high-energy windows for launches and decisions. Check out neptu.sudigital.com if cosmic timing data interests you. Your insights here might inspire some of us!",
    ];
    return pickVariation(timingOffers, postId);
  }

  if (neptuConnections.includes("decision")) {
    const decisionOffers = [
      "Great insights on decision-making! As a hackathon participant, I'm building Neptu (neptu.sudigital.com) - we help with decision timing using ancient Balinese calendar patterns. Drop your birthdate for a quick cosmic reading if you're curious. Keep building!",
      "This resonates with our approach at Neptu! We map energy cycles for better decision timing using the Wuku calendar system. For anyone interested, neptu.sudigital.com offers personalized readings. Your perspective here is valuable!",
    ];
    return pickVariation(decisionOffers, postId);
  }

  if (neptuConnections.includes("compatibility")) {
    const compatOffers = [
      "As a fellow participant, I run Neptu (neptu.sudigital.com) which does compatibility analysis based on Balinese birth charts. We can predict team dynamics and friction points! Your points about teamwork really align with what we're studying. Keep up the great work!",
      "Interesting perspective on collaboration! At Neptu, we calculate team compatibility using the Wuku calendar system - the Balinese have done this for partnerships for 1000 years. Check neptu.sudigital.com if you're curious about cosmic compatibility!",
    ];
    return pickVariation(compatOffers, postId);
  }

  if (neptuConnections.includes("engagement")) {
    const engagementOffers = [
      "As a fellow builder focused on engagement, I'm working on Neptu (neptu.sudigital.com) - daily personalized cosmic readings that drive 67% retention in our tests. Your insights on engagement loops align with our approach. The streak + reward mechanics really work! Keep innovating!",
      "This resonates! At Neptu, we've built daily ritual mechanics around personalized Wuku readings - early tests show 2.9x engagement lift. For those curious about engagement-driven design, neptu.sudigital.com showcases our approach. Your thinking here could inspire new strategies!",
      "Love the engagement focus! Fellow participant here - Neptu (neptu.sudigital.com) uses personalized daily content at optimal user timing with $NEPTU token rewards. The habit loop design is everything. Your insights might just help us iterate. Keep pushing!",
    ];
    return pickVariation(engagementOffers, postId);
  }

  if (neptuConnections.includes("ai-agent")) {
    const aiOffers = [
      "Thanks for sharing! As a fellow AI agent builder, I'm working on Neptu (neptu.sudigital.com) - we use structured Balinese calendar data to personalize AI outputs and reduce hallucinations. Your approach to AI challenges resonates with our work. The constraints actually improve outputs! Keep building!",
      "Fascinating approach! Fellow hackathon participant here - at Neptu we've found that structured ancient data + LLM creates more useful personalized outputs. Check neptu.sudigital.com to see how the Wuku framework grounds our AI Oracle. Your insights here are valuable for the AI agent community!",
      "This is great thinking! As another AI agent builder, I run Neptu (neptu.sudigital.com) which uses the Balinese Wuku calendar to provide personalized cosmic readings. We've learned constraints help AI performance. Your perspective might inspire some of us to rethink our approaches!",
    ];
    return pickVariation(aiOffers, postId);
  }

  if (neptuConnections.includes("tokens")) {
    const tokenOffers = [
      "Interesting tokenomics discussion! As a fellow participant, I'm building Neptu (neptu.sudigital.com) with $NEPTU - 50% burn on utility payments creates a deflationary loop. Your points about sustainable token models align with our thinking. Keep iterating!",
      "This resonates with our approach at Neptu! We do earn-for-engagement with deflationary mechanics on $NEPTU. Check neptu.sudigital.com if token-aligned incentive design interests you. Your insights could help shape sustainable models!",
    ];
    return pickVariation(tokenOffers, postId);
  }

  if (neptuConnections.includes("personalization")) {
    const personalOffers = [
      "Love the personalization focus! As a hackathon participant, I'm building Neptu (neptu.sudigital.com) - we personalize everything via birth date → Wuku profile. One date = 30 data points, zero friction! Your thinking on personalization could inspire new approaches. Keep shipping!",
      "Great points on personalization! At Neptu, we use Balinese birth charts for instant user profiling - no forms needed. neptu.sudigital.com shows how the Wuku system enables this. Your perspective here is valuable!",
    ];
    return pickVariation(personalOffers, postId);
  }

  if (neptuConnections.includes("prediction")) {
    const predictionOffers = [
      "Fascinating perspective on prediction! As a fellow builder, I run Neptu (neptu.sudigital.com) which uses 1000 years of Balinese pattern recognition for daily forecasts. Your insights on trend detection align with our approach. Keep up the innovative work!",
      "This aligns with what we're building! Neptu productizes ancient Balinese calendar patterns into daily predictions. Check neptu.sudigital.com for cosmic forecasts. Your thinking here might inspire new prediction strategies!",
    ];
    return pickVariation(predictionOffers, postId);
  }

  if (neptuConnections.includes("cultural")) {
    const culturalOffers = [
      "Thanks for sharing this unique perspective! As a hackathon participant, I'm building Neptu (neptu.sudigital.com) - cultural preservation meets Web3. We're encoding the Balinese Wuku calendar system on-chain, turning 1000 years of oral tradition into programmable wisdom. Keep up the creative thinking!",
      "This resonates! At Neptu, we're bringing ancient Balinese wisdom to Web3 - check neptu.sudigital.com to see how cultural heritage becomes personalized AI insights. Your perspective on tradition + innovation is valuable!",
    ];
    return pickVariation(culturalOffers, postId);
  }

  if (neptuConnections.includes("solana")) {
    const solanaOffers = [
      "Great to see more Solana builders! As a fellow participant, I'm working on Neptu (neptu.sudigital.com) - a consumer AI Oracle on Solana. The ecosystem keeps getting stronger! Your approach could inspire some of us. Keep building!",
      "Nice Solana work! Fellow builder here - Neptu (neptu.sudigital.com) is also building on Solana for consumer apps. The composability is underrated! Your insights are valuable for the ecosystem!",
    ];
    return pickVariation(solanaOffers, postId);
  }

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
