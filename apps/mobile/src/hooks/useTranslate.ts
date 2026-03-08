import { useMemo } from "react";

import { createTranslate, type TranslateFn } from "../i18n";
import { getLanguage } from "../services/storage";

/**
 * Hook to get the translate function based on current language setting.
 * Same pattern as web's useTranslate.
 */
export function useTranslate(): TranslateFn {
  const language = useMemo(() => getLanguage(), []);
  const t = useMemo(() => createTranslate(language), [language]);
  return t;
}
