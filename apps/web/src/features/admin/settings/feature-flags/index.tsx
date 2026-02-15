import { ContentSection } from "../components/content-section";
import { FeatureFlagsCard } from "./feature-flags-card";

export function SettingsFeatureFlags() {
  return (
    <ContentSection
      title="Feature Flags"
      desc="Platform feature toggles and configuration"
    >
      <FeatureFlagsCard />
    </ContentSection>
  );
}
