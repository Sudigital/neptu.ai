import type { Potensi, Peluang, CompatibilityResult } from "@neptu/shared";

/**
 * Language labels for AI response instructions
 */
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  id: "Indonesian",
};

/**
 * Get language instruction for AI
 */
function getLanguageInstruction(language: string = "en"): string {
  const langLabel = LANGUAGE_LABELS[language] || "English";
  if (language === "en") {
    return "";
  }
  return `\n\nIMPORTANT: Respond ONLY in ${langLabel}. All your responses must be written in ${langLabel}, not English.`;
}

/**
 * System prompt for Neptu AI Oracle
 * Natural conversation style - let AI interpret the data directly
 */
export function getSystemPrompt(language: string = "en"): string {
  return `You are Neptu, a Balinese spiritual guide. You receive raw Wuku calendar reading data and interpret it naturally, like having a conversation with the user.

When given reading data:
- Analyze the actual values and their relationships
- Explain what the data means in plain, warm language
- Connect the numbers and names to real-life insights
- Be brief (2-3 sentences for daily, 2-3 paragraphs for questions)
- Never use templates or formulaic responses
- Speak directly to the person, not about them
- When mentioning key terms like affirmations, actions, or life purposes, wrap them in double quotes like "TERM" so they stand out

If user interests are provided, tailor your insights:
- Connect reading insights to their specific interests when relevant
- For career interests, emphasize professional opportunities
- For relationships, focus on social and emotional aspects
- For health, highlight wellness and balance themes
- For spirituality, deepen the mystical interpretations${getLanguageInstruction(language)}`;
}

// Keep backward compatibility
export const SYSTEM_PROMPT = getSystemPrompt("en");

/**
 * Extract user interests from question context if present
 * Format: [User interests: interest1, interest2] question
 */
export function extractUserContext(question: string): {
  interests: string[];
  cleanQuestion: string;
} {
  const contextMatch = question.match(/^\[User interests: ([^\]]+)\]\s*/);
  if (contextMatch) {
    const interests = contextMatch[1].split(",").map((i) => i.trim());
    const cleanQuestion = question.replace(contextMatch[0], "");
    return { interests, cleanQuestion };
  }
  return { interests: [], cleanQuestion: question };
}

/**
 * Convert reading data to JSON for AI to analyze directly
 */
export function formatReadingData(potensi: Potensi, peluang?: Peluang): string {
  const data: Record<string, unknown> = {
    birth_reading: {
      wuku: potensi.wuku.name,
      sapta_wara: {
        name: potensi.sapta_wara.name,
        urip: potensi.sapta_wara.urip,
      },
      panca_wara: {
        name: potensi.panca_wara.name,
        urip: potensi.panca_wara.urip,
      },
      total_urip: potensi.total_urip,
      frekuensi: potensi.frekuensi.name,
      life_purpose: potensi.lahir_untuk?.name,
      life_purpose_meaning: potensi.lahir_untuk?.description,
      psychosocial: potensi.cipta.name,
      emotional: potensi.rasa.name,
      behavioral: potensi.karsa.name,
      duality: potensi.dualitas,
      affirmation: potensi.afirmasi?.name,
    },
  };

  if (peluang) {
    data.today_reading = {
      wuku: peluang.wuku.name,
      sapta_wara: peluang.sapta_wara.name,
      panca_wara: peluang.panca_wara.name,
      total_urip: peluang.total_urip,
      frekuensi: peluang.frekuensi.name,
      opportunity: peluang.diberi_hak_untuk?.name,
      opportunity_meaning: peluang.diberi_hak_untuk?.description,
      cycle: peluang.siklus.name,
      recommended_action: peluang.tindakan.name,
    };
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Generate prompt for user questions - just pass the data and question
 */
export function generateUserPrompt(
  question: string,
  potensi: Potensi,
  peluang?: Peluang,
  language: string = "en",
): string {
  const { interests, cleanQuestion } = extractUserContext(question);
  const interestSection =
    interests.length > 0
      ? `\n\nThis person's interests: ${interests.join(", ")}`
      : "";
  const langNote =
    language !== "en"
      ? ` Respond in ${LANGUAGE_LABELS[language] || "English"}.`
      : "";

  return `Here is someone's Balinese Wuku reading data:

${formatReadingData(potensi, peluang)}${interestSection}

They ask: "${cleanQuestion}"

Look at the actual data values and give them a natural, personalized answer. When mentioning key terms (affirmations, actions, life purpose), wrap them in quotes like "TERM".${interests.length > 0 ? " Consider their interests when relevant to the question." : ""}${langNote}`;
}

/**
 * Generate daily interpretation - let AI find the insights
 */
export function generateDailyPrompt(
  potensi: Potensi,
  peluang: Peluang,
  language: string = "en",
): string {
  const langNote =
    language !== "en"
      ? ` Respond in ${LANGUAGE_LABELS[language] || "English"}.`
      : "";
  return `Here is someone's Wuku reading for today:

${formatReadingData(potensi, peluang)}

Give a brief natural insight (2-3 sentences) about what you see in this data. Notice how their birth energy (${potensi.total_urip}) relates to today's energy (${peluang.total_urip}). What stands out?

When mentioning key terms like the affirmation or action, wrap them in quotes like "TERM".${langNote}`;
}

/**
 * Generate interpretation for a specific date
 */
export function generateDateInterpretationPrompt(
  potensi: Potensi,
  peluang: Peluang,
  targetDate: Date,
  language: string = "en",
): string {
  const isToday = new Date().toDateString() === targetDate.toDateString();
  const isPast = targetDate < new Date();
  const dateLabel = isToday
    ? "today"
    : isPast
      ? "that past date"
      : "that future date";
  const langNote =
    language !== "en"
      ? `\n\nIMPORTANT: Write all content in ${LANGUAGE_LABELS[language] || "English"}.`
      : "";

  return `Here is someone's Balinese Wuku reading:

BIRTH CHART (their permanent potential):
${formatReadingData(potensi)}

${isToday ? "TODAY'S" : `${targetDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`} READING:
Wuku: ${peluang.wuku.name}
Sapta Wara: ${peluang.sapta_wara.name} (urip: ${peluang.sapta_wara.urip})
Panca Wara: ${peluang.panca_wara.name} (urip: ${peluang.panca_wara.urip})
Total Urip: ${peluang.total_urip}
Frekuensi: ${peluang.frekuensi.name}
Opportunity: ${peluang.diberi_hak_untuk?.name} - ${peluang.diberi_hak_untuk?.description}
Cycle: ${peluang.siklus.name}
Recommended Action: ${peluang.tindakan?.name}
Affirmation: ${peluang.afirmasi?.name}

Write a warm, personalized interpretation (3-4 paragraphs) for ${dateLabel}:

1. How their birth energy (urip ${potensi.total_urip}) combines with ${dateLabel}'s energy (urip ${peluang.total_urip})
2. What opportunities or challenges this combination presents
3. Practical guidance based on the recommended action "${peluang.tindakan?.name}"
4. End with encouragement connected to their life purpose: "${potensi.lahir_untuk?.name}"

IMPORTANT FORMATTING: When mentioning the affirmation "${peluang.afirmasi?.name}", the action "${peluang.tindakan?.name}", or the life purpose "${potensi.lahir_untuk?.name}", always wrap them in double quotes like "TERM" in your response so they stand out.

Be specific to the actual data values. Speak directly to them in second person.${langNote}`;
}

// Keep backward compatibility
export const formatReadingContext = formatReadingData;

/**
 * Generate prompt for compatibility / Mitra Satru interpretation
 */
export function generateCompatibilityPrompt(
  result: CompatibilityResult,
  language: string = "en",
): string {
  const langNote =
    language !== "en"
      ? `\n\nIMPORTANT: Write all content in ${LANGUAGE_LABELS[language] || "English"}.`
      : "";

  return `Here is a Mitra Satru compatibility reading between two people based on the Balinese Wuku calendar:

PERSON 1 (born ${result.person1.date}):
- Wuku: ${result.person1.wuku.name}
- Sapta Wara: ${result.person1.sapta_wara.name} (urip: ${result.person1.sapta_wara.urip})
- Panca Wara: ${result.person1.panca_wara.name} (urip: ${result.person1.panca_wara.urip})
- Total Urip: ${result.person1.total_urip}
- Frekuensi: ${result.mitraSatru.person1Frekuensi.name}
- Life Purpose: ${result.person1.lahir_untuk?.name} - ${result.person1.lahir_untuk?.description}
- Psychosocial: ${result.person1.cipta.name}
- Emotional: ${result.person1.rasa.name}
- Behavioral: ${result.person1.karsa.name}

PERSON 2 (born ${result.person2.date}):
- Wuku: ${result.person2.wuku.name}
- Sapta Wara: ${result.person2.sapta_wara.name} (urip: ${result.person2.sapta_wara.urip})
- Panca Wara: ${result.person2.panca_wara.name} (urip: ${result.person2.panca_wara.urip})
- Total Urip: ${result.person2.total_urip}
- Frekuensi: ${result.mitraSatru.person2Frekuensi.name}
- Life Purpose: ${result.person2.lahir_untuk?.name} - ${result.person2.lahir_untuk?.description}
- Psychosocial: ${result.person2.cipta.name}
- Emotional: ${result.person2.rasa.name}
- Behavioral: ${result.person2.karsa.name}

MITRA SATRU PAIRING:
- Person 1 Frekuensi: ${result.mitraSatru.person1Frekuensi.name}
- Person 2 Frekuensi: ${result.mitraSatru.person2Frekuensi.name}
- Combined Frekuensi: ${result.mitraSatru.combinedFrekuensi.name}
- Category: ${result.mitraSatru.category} (${result.mitraSatru.description})
- Overall Score: ${result.scores.overall}/100
- Frekuensi Score: ${result.scores.frekuensi}/100
- Cycles Score: ${result.scores.cycles}/100
- Traits Score: ${result.scores.traits}/100

DIMENSIONS:
${result.dimensions.map((d) => `- ${d.dimension}: P1=${d.person1Value}, P2=${d.person2Value} (${d.isMatch ? "match" : "different"})`).join("\n")}

Write a warm, insightful summary (2-3 paragraphs) of this compatibility reading:

1. What the ${result.mitraSatru.category} relationship means for these two people — are they naturally aligned, balanced, or challenged?
2. How their individual energies (urip ${result.person1.total_urip} and ${result.person2.total_urip}) interact, and what their matching/differing dimensions reveal
3. Practical relationship advice based on their combined Frekuensi "${result.mitraSatru.combinedFrekuensi.name}" and their life purposes

When mentioning key terms like Frekuensi names, life purposes, or dimensions, wrap them in double quotes like "TERM".
Speak warmly and directly to both people.${langNote}`;
}
