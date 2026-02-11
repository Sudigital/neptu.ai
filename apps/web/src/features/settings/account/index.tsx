import { useTranslate } from "@/hooks/use-translate";
import { ContentSection } from "../components/content-section";
import { AccountForm } from "./account-form";

export function SettingsAccount() {
  const t = useTranslate();
  return (
    <ContentSection
      title={t("settings.account.title", "Account")}
      desc={t(
        "settings.account.desc",
        "Update your account settings. Set your preferred language and timezone.",
      )}
    >
      <AccountForm />
    </ContentSection>
  );
}
