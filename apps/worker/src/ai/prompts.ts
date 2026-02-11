import type { Potensi, Peluang, CompatibilityResult } from "@neptu/shared";
import {
  LANGUAGE_LABELS,
  TERM_TRANSLATIONS,
  translateTerm,
  postProcessResponse,
} from "./translations";

export { postProcessResponse };

/**
 * Build a glossary of translated terms for the AI to use.
 * Only includes terms that appear in the reading data.
 */
function buildTranslationGlossary(
  potensi: Potensi,
  peluang: Peluang | undefined,
  language: string,
): string {
  if (language === "en") return "";

  const langLabel = LANGUAGE_LABELS[language] || language;
  const terms: [string, string][] = [];

  const addTerm = (original: string | undefined) => {
    if (!original) return;
    const translated = TERM_TRANSLATIONS[original]?.[language];
    if (translated && translated !== original) {
      terms.push([original, translated]);
    }
  };

  // Collect all terms from reading data
  addTerm(potensi.lahir_untuk?.name);
  addTerm(potensi.lahir_untuk?.description);
  addTerm(potensi.cipta?.name);
  addTerm(potensi.rasa?.name);
  addTerm(potensi.karsa?.name);
  addTerm(potensi.afirmasi?.name);
  addTerm(potensi.frekuensi?.name);
  addTerm(potensi.tindakan?.name);
  addTerm(potensi.sapta_wara?.name);
  addTerm(potensi.panca_wara?.name);
  addTerm(potensi.sad_wara?.name);
  addTerm(potensi.wuku?.name);
  addTerm(potensi.siklus?.name);
  addTerm(potensi.kanda_pat?.name);
  if (peluang) {
    addTerm(peluang.diberi_hak_untuk?.name);
    addTerm(peluang.diberi_hak_untuk?.description);
    addTerm(peluang.tindakan?.name);
    addTerm(peluang.afirmasi?.name);
    addTerm(peluang.frekuensi?.name);
    addTerm(peluang.sapta_wara?.name);
    addTerm(peluang.panca_wara?.name);
    addTerm(peluang.sad_wara?.name);
    addTerm(peluang.wuku?.name);
    addTerm(peluang.siklus?.name);
    addTerm(peluang.kanda_pat?.name);
  }

  if (terms.length === 0) return "";

  const glossary = terms.map(([en, tr]) => `  "${en}" → "${tr}"`).join("\n");
  return `\n\nTRANSLATION GLOSSARY (use these ${langLabel} terms instead of the English/Balinese originals):\n${glossary}\nAlways use the translated terms above in your response, wrapped in double quotes.`;
}

/**
 * Get language instruction for AI
 */
function getLanguageInstruction(language: string = "en"): string {
  const langLabel = LANGUAGE_LABELS[language] || "English";
  if (language === "en") {
    return "";
  }
  return `\n\nIMPORTANT: Respond ONLY in ${langLabel}. All your responses must be written in ${langLabel}, not English. When mentioning Balinese terms (like RATU, LARA, PATI, GURU, wuku names, tindakan, etc.), translate them using their ${langLabel} equivalents. Do NOT leave English/Balinese terms untranslated in your response.`;
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
export function formatReadingData(
  potensi: Potensi,
  peluang?: Peluang,
  language: string = "en",
): string {
  const uripLabel = translateTerm("urip", language);
  const data: Record<string, unknown> = {
    birth_reading: {
      wuku: translateTerm(potensi.wuku.name, language),
      sapta_wara: {
        name: translateTerm(potensi.sapta_wara.name, language),
        [uripLabel]: potensi.sapta_wara.urip,
      },
      panca_wara: {
        name: translateTerm(potensi.panca_wara.name, language),
        [uripLabel]: potensi.panca_wara.urip,
      },
      sad_wara: {
        name: translateTerm(potensi.sad_wara.name, language),
        [uripLabel]: potensi.sad_wara.urip,
      },
      [`total_${uripLabel}`]: potensi.total_urip,
      frekuensi: translateTerm(potensi.frekuensi.name, language),
      life_purpose: translateTerm(potensi.lahir_untuk?.name, language),
      life_purpose_meaning: translateTerm(
        potensi.lahir_untuk?.description,
        language,
      ),
      psychosocial: translateTerm(potensi.cipta.name, language),
      emotional: translateTerm(potensi.rasa.name, language),
      behavioral: translateTerm(potensi.karsa.name, language),
      duality: potensi.dualitas,
      affirmation: translateTerm(potensi.afirmasi?.name, language),
    },
  };

  if (peluang) {
    data.today_reading = {
      wuku: translateTerm(peluang.wuku.name, language),
      sapta_wara: translateTerm(peluang.sapta_wara.name, language),
      panca_wara: translateTerm(peluang.panca_wara.name, language),
      sad_wara: translateTerm(peluang.sad_wara.name, language),
      [`total_${uripLabel}`]: peluang.total_urip,
      frekuensi: translateTerm(peluang.frekuensi.name, language),
      opportunity: translateTerm(peluang.diberi_hak_untuk?.name, language),
      opportunity_meaning: translateTerm(
        peluang.diberi_hak_untuk?.description,
        language,
      ),
      cycle: translateTerm(peluang.siklus.name, language),
      recommended_action: translateTerm(peluang.tindakan.name, language),
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

${formatReadingData(potensi, peluang, language)}${interestSection}

They ask: "${cleanQuestion}"

Look at the actual data values and give them a natural, personalized answer. When mentioning key terms (affirmations, actions, life purpose), wrap them in quotes like "TERM".${interests.length > 0 ? " Consider their interests when relevant to the question." : ""}${langNote}${buildTranslationGlossary(potensi, peluang || undefined, language)}`;
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

${formatReadingData(potensi, peluang, language)}

Give a brief natural insight (2-3 sentences) about what you see in this data. Notice how their birth wuku ${translateTerm(potensi.wuku.name, language)} (${translateTerm("urip", language)} ${potensi.total_urip}) relates to today's wuku ${translateTerm(peluang.wuku.name, language)} (${translateTerm("urip", language)} ${peluang.total_urip}). What stands out?

When mentioning key terms like the affirmation or action, wrap them in quotes like "TERM".${langNote}${buildTranslationGlossary(potensi, peluang, language)}`;
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

  // Translate key terms for non-English languages
  const actionLabel = translateTerm(peluang.tindakan?.name, language);
  const purposeLabel = translateTerm(potensi.lahir_untuk?.name, language);
  const affirmationLabel = translateTerm(peluang.afirmasi?.name, language);
  const opportunityLabel = translateTerm(
    peluang.diberi_hak_untuk?.name,
    language,
  );
  const opportunityDescLabel = translateTerm(
    peluang.diberi_hak_untuk?.description,
    language,
  );

  return `Here is someone's Balinese Wuku reading:

BIRTH CHART (their permanent potential):
${formatReadingData(potensi, undefined, language)}

${isToday ? "TODAY'S" : `${targetDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`} READING:
Wuku: ${translateTerm(peluang.wuku.name, language)}
Sapta Wara: ${translateTerm(peluang.sapta_wara.name, language)} (${translateTerm("urip", language)}: ${peluang.sapta_wara.urip})
Panca Wara: ${translateTerm(peluang.panca_wara.name, language)} (${translateTerm("urip", language)}: ${peluang.panca_wara.urip})
Sad Wara: ${translateTerm(peluang.sad_wara.name, language)} (${translateTerm("urip", language)}: ${peluang.sad_wara.urip})
Total ${translateTerm("urip", language)}: ${peluang.total_urip}
Frekuensi: ${translateTerm(peluang.frekuensi.name, language)}
Opportunity: ${opportunityLabel} - ${opportunityDescLabel}
Cycle: ${translateTerm(peluang.siklus.name, language)}
Recommended Action: ${actionLabel}
Affirmation: ${affirmationLabel}

Write a warm, personalized interpretation (3-4 paragraphs) for ${dateLabel}:

1. How their birth wuku ${translateTerm(potensi.wuku.name, language)} (${translateTerm("urip", language)} ${potensi.total_urip}) combines with ${dateLabel}'s wuku ${translateTerm(peluang.wuku.name, language)} (${translateTerm("urip", language)} ${peluang.total_urip})
2. What opportunities or challenges this combination presents
3. Practical guidance based on the recommended action "${actionLabel}"
4. End with encouragement connected to their life purpose: "${purposeLabel}"

IMPORTANT FORMATTING: When mentioning the affirmation "${affirmationLabel}", the action "${actionLabel}", or the life purpose "${purposeLabel}", always wrap them in double quotes like "TERM" in your response so they stand out.

Be specific to the actual data values. Speak directly to them in second person.${langNote}${buildTranslationGlossary(potensi, peluang, language)}`;
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
- Wuku: ${translateTerm(result.person1.wuku.name, language)}
- Sapta Wara: ${translateTerm(result.person1.sapta_wara.name, language)} (${translateTerm("urip", language)}: ${result.person1.sapta_wara.urip})
- Panca Wara: ${translateTerm(result.person1.panca_wara.name, language)} (${translateTerm("urip", language)}: ${result.person1.panca_wara.urip})
- Sad Wara: ${translateTerm(result.person1.sad_wara.name, language)} (${translateTerm("urip", language)}: ${result.person1.sad_wara.urip})
- Total ${translateTerm("urip", language)}: ${result.person1.total_urip}
- Frekuensi: ${translateTerm(result.mitraSatru.person1Frekuensi.name, language)}
- Life Purpose: ${translateTerm(result.person1.lahir_untuk?.name, language)} - ${translateTerm(result.person1.lahir_untuk?.description, language)}
- Psychosocial: ${translateTerm(result.person1.cipta.name, language)}
- Emotional: ${translateTerm(result.person1.rasa.name, language)}
- Behavioral: ${translateTerm(result.person1.karsa.name, language)}

PERSON 2 (born ${result.person2.date}):
- Wuku: ${translateTerm(result.person2.wuku.name, language)}
- Sapta Wara: ${translateTerm(result.person2.sapta_wara.name, language)} (${translateTerm("urip", language)}: ${result.person2.sapta_wara.urip})
- Panca Wara: ${translateTerm(result.person2.panca_wara.name, language)} (${translateTerm("urip", language)}: ${result.person2.panca_wara.urip})
- Sad Wara: ${translateTerm(result.person2.sad_wara.name, language)} (${translateTerm("urip", language)}: ${result.person2.sad_wara.urip})
- Total ${translateTerm("urip", language)}: ${result.person2.total_urip}
- Frekuensi: ${translateTerm(result.mitraSatru.person2Frekuensi.name, language)}
- Life Purpose: ${translateTerm(result.person2.lahir_untuk?.name, language)} - ${translateTerm(result.person2.lahir_untuk?.description, language)}
- Psychosocial: ${translateTerm(result.person2.cipta.name, language)}
- Emotional: ${translateTerm(result.person2.rasa.name, language)}
- Behavioral: ${translateTerm(result.person2.karsa.name, language)}

MITRA SATRU PAIRING:
- Person 1 Frekuensi: ${translateTerm(result.mitraSatru.person1Frekuensi.name, language)}
- Person 2 Frekuensi: ${translateTerm(result.mitraSatru.person2Frekuensi.name, language)}
- Combined Frekuensi: ${translateTerm(result.mitraSatru.combinedFrekuensi.name, language)}
- Category: ${result.mitraSatru.category} (${result.mitraSatru.description})
- Overall Score: ${result.scores.overall}/100
- Frekuensi Score: ${result.scores.frekuensi}/100
- Cycles Score: ${result.scores.cycles}/100
- Traits Score: ${result.scores.traits}/100

DIMENSIONS:
${result.dimensions.map((d) => `- ${d.dimension}: P1=${d.person1Value}, P2=${d.person2Value} (${d.isMatch ? "match" : "different"})`).join("\n")}

Write a warm, insightful summary (2-3 paragraphs) of this compatibility reading:

1. What the ${result.mitraSatru.category} relationship means for these two people — are they naturally aligned, balanced, or challenged?
2. How their individual energies (${translateTerm(result.person1.wuku.name, language)} ${translateTerm("urip", language)} ${result.person1.total_urip} and ${translateTerm(result.person2.wuku.name, language)} ${translateTerm("urip", language)} ${result.person2.total_urip}) interact, and what their matching/differing dimensions reveal
3. Practical relationship advice based on their combined Frekuensi "${result.mitraSatru.combinedFrekuensi.name}" and their life purposes

When mentioning key terms like Frekuensi names, life purposes, or dimensions, wrap them in double quotes like "TERM".
Speak warmly and directly to both people.${langNote}`;
}
