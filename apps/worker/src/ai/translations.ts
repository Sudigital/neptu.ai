import { TERM_TRANSLATIONS } from "./term-data";

export { TERM_TRANSLATIONS };

/**
 * Language labels for AI response instructions
 */
export const LANGUAGE_LABELS: Record<string, string> = {
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
 * Translate a database term to the target language.
 * Returns the translated term or the original if no translation exists.
 */
export function translateTerm(
  term: string | undefined,
  language: string,
): string {
  if (!term || language === "en") return term || "";
  return TERM_TRANSLATIONS[term]?.[language] || term;
}

/**
 * Post-process AI response to force-replace any remaining untranslated terms.
 * The AI sometimes ignores glossary instructions and leaves English terms.
 */
export function postProcessResponse(text: string, language: string): string {
  if (!text || language === "en") return text;

  let result = text;
  // Sort keys by length descending so longer terms are replaced first
  // e.g. "DEEP SLEEP" before "SLEEP", "LARGE INTESTINE" before "LARGE"
  const sortedKeys = Object.keys(TERM_TRANSLATIONS).sort(
    (a, b) => b.length - a.length,
  );

  for (const term of sortedKeys) {
    const translated = TERM_TRANSLATIONS[term][language];
    if (!translated || translated === term) continue;
    // Replace term in quotes: "TERM" → "translated"
    result = result.replaceAll(`"${term}"`, `"${translated}"`);
    // Replace standalone term (word boundary - not inside another word)
    // Use a regex with word boundaries for non-CJK terms
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, "g");
    result = result.replace(regex, translated);
  }

  return result;
}
