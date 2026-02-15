import { ContentSection } from "../components/content-section";
import { CreditPacksCard } from "./credit-packs-card";

export function SettingsCreditPacks() {
  return (
    <ContentSection
      title="Credit Packs"
      desc="Manage credit pack offerings and pricing"
    >
      <CreditPacksCard />
    </ContentSection>
  );
}
