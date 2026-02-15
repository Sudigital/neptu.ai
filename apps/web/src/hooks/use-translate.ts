import { createTranslate, type TranslateFn } from "@/i18n";
import { useSettingsStore } from "@/stores/settings-store";
import { useMemo } from "react";

/**
 * Hook to get the translate function based on current language setting
 */
export function useTranslate(): TranslateFn {
  const { language } = useSettingsStore();

  const t = useMemo(() => createTranslate(language), [language]);

  return t;
}
