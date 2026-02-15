import { ContentSection } from "../components/content-section";
import { GeneralSettingsForm } from "./general-settings-form";

export function SettingsGeneral() {
  return (
    <ContentSection
      title="General"
      desc="Platform configuration and system settings."
    >
      <GeneralSettingsForm />
    </ContentSection>
  );
}
