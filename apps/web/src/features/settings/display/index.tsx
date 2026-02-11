import { useTranslate } from "@/hooks/use-translate";
import { ContentSection } from "../components/content-section";
import { DisplayForm } from "./display-form";

export function SettingsDisplay() {
  const t = useTranslate();
  return (
    <ContentSection
      title={t("settings.display.title", "Display")}
      desc={t(
        "settings.display.desc",
        "Turn items on or off to control what's displayed in the app.",
      )}
    >
      <DisplayForm />
    </ContentSection>
  );
}
