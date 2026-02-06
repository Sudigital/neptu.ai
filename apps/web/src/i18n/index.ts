import en from "./en.json";
import id from "./id.json";
import fr from "./fr.json";
import de from "./de.json";
import es from "./es.json";
import pt from "./pt.json";
import ru from "./ru.json";
import ja from "./ja.json";
import ko from "./ko.json";
import zh from "./zh.json";

type TranslationDict = Record<string, string>;

const translations: Record<string, TranslationDict> = {
  en,
  id,
  fr,
  de,
  es,
  pt,
  ru,
  ja,
  ko,
  zh,
};

/**
 * Create a translate function for a specific language
 * Falls back to English if key not found in target language
 */
export function createTranslate(language: string) {
  const dict = translations[language] || translations.en;
  const fallbackDict = translations.en;

  return (key: string, fallback?: string): string => {
    return dict[key] || fallbackDict[key] || fallback || key;
  };
}

/**
 * Get available languages
 */
export function getAvailableLanguages() {
  return Object.keys(translations);
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language in translations;
}

export type TranslateFn = ReturnType<typeof createTranslate>;
