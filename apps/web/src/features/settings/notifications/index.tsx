import { useTranslate } from "@/hooks/use-translate";

import { ContentSection } from "../components/content-section";
import { NotificationsForm } from "./notifications-form";

export function SettingsNotifications() {
  const t = useTranslate();
  return (
    <ContentSection
      title={t("settings.notifications.title", "Notifications")}
      desc={t(
        "settings.notifications.desc",
        "Configure how you receive notifications."
      )}
    >
      <NotificationsForm />
    </ContentSection>
  );
}
