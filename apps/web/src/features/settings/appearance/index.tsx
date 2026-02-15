import { useTranslate } from "@/hooks/use-translate";

import { ContentSection } from "../components/content-section";
import { AppearanceForm } from "./appearance-form";

export function SettingsAppearance() {
  const t = useTranslate();
  return (
    <ContentSection
      title={t("settings.appearance.title", "Appearance")}
      desc={t(
        "settings.appearance.desc",
        "Customize the appearance of the app. Automatically switch between day and night themes."
      )}
    >
      <AppearanceForm />
    </ContentSection>
  );
}
