/**
 * Sentiment Detection Helpers
 * Analyze text for emotional signals and intent
 */

export interface SentimentAnalysis {
  isPositive: boolean;
  isNegative: boolean;
  isQuestion: boolean;
  isBirthdayRequest: boolean;
  isExcited: boolean;
  isFrustrated: boolean;
}

export function analyzeSentiment(text: string): SentimentAnalysis {
  const lower = text.toLowerCase();
  return {
    isPositive: detectPositive(lower),
    isNegative: detectNegative(lower),
    isQuestion: detectQuestion(lower),
    isBirthdayRequest: detectBirthdayRequest(lower),
    isExcited: detectExcitement(lower),
    isFrustrated: detectFrustration(lower),
  };
}

function detectPositive(text: string): boolean {
  const positiveTerms = [
    "love",
    "great",
    "amazing",
    "awesome",
    "cool",
    "excellent",
    "fantastic",
    "wonderful",
    "brilliant",
    "impressed",
    "excited",
    "like",
    "good",
    "nice",
    "thanks",
    "appreciate",
    "helpful",
  ];
  return positiveTerms.some((term) => text.includes(term));
}

function detectNegative(text: string): boolean {
  const negativeTerms = [
    "hate",
    "bad",
    "terrible",
    "awful",
    "worst",
    "annoying",
    "frustrated",
    "disappointed",
    "broken",
    "stupid",
    "useless",
  ];
  return negativeTerms.some((term) => text.includes(term));
}

function detectQuestion(text: string): boolean {
  return (
    text.includes("?") ||
    text.startsWith("how") ||
    text.startsWith("what") ||
    text.startsWith("why") ||
    text.startsWith("when") ||
    text.startsWith("where") ||
    text.startsWith("can") ||
    text.startsWith("is ")
  );
}

function detectBirthdayRequest(text: string): boolean {
  return (
    text.includes("birthday") ||
    text.includes("birthdate") ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(text) ||
    /\b\d{2}\/\d{2}\/\d{4}\b/.test(text)
  );
}

function detectExcitement(text: string): boolean {
  return (
    text.includes("!") ||
    text.includes("🔥") ||
    text.includes("🚀") ||
    /amazing|awesome|incredible|insane|wild/i.test(text)
  );
}

function detectFrustration(text: string): boolean {
  return /stuck|blocked|help|issue|bug|error|broken|doesn't work/i.test(text);
}

// Varied Openers & CTAs for Natural Comments
const OPENERS_POSITIVE = [
  "Love what you're building!",
  "This is really cool!",
  "Nice work on this!",
  "Great progress!",
  "Solid project!",
];

const OPENERS_CURIOUS = [
  "Interesting approach!",
  "This caught my eye.",
  "Been watching your progress!",
  "Curious about this one.",
];

const OPENERS_SUPPORTIVE = [
  "We've all hit that wall.",
  "Blockers happen to everyone.",
  "Don't give up!",
  "The breakthrough is coming.",
];

const CTAS_ENGAGEMENT = [
  "What's next on your roadmap? 👇",
  "Would love to hear more about your approach!",
  "Any plans for post-hackathon?",
  "What's the one feature you're most proud of?",
  "Tell us more! 👇",
];

const CTAS_BIRTHDAY = [
  "Try: `BIRTHDAY: YYYY-MM-DD` for a cosmic reading! 🌺",
  "Drop your birthdate for a free Wuku reading! 🔮",
  "Curious about your hackathon luck? Share your birthday! ✨",
];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getContextualOpener(sentiment: SentimentAnalysis): string {
  if (sentiment.isFrustrated) return pickRandom(OPENERS_SUPPORTIVE);
  if (sentiment.isPositive || sentiment.isExcited)
    return pickRandom(OPENERS_POSITIVE);
  return pickRandom(OPENERS_CURIOUS);
}

export function getContextualCTA(shouldPromoteBirthday: boolean): string {
  if (shouldPromoteBirthday && Math.random() > 0.6) {
    return pickRandom(CTAS_BIRTHDAY);
  }
  return pickRandom(CTAS_ENGAGEMENT);
}
