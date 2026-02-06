import { useTranslate } from "@/hooks/use-translate";
import { ContentSection } from "../components/content-section";
import { NeptuProfileForm } from "./neptu-profile-form";

export function SettingsProfile() {
  const t = useTranslate();
  return (
    <ContentSection
      title={t("settings.profile")}
      desc={t("settings.profile.desc")}
    >
      <NeptuProfileForm />
    </ContentSection>
  );
}
