import "dotenv/config";
import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Neptu",
  slug: "neptu",
  extra: {
    privyAppId: process.env.VITE_PRIVY_APP_ID,
    apiUrl: process.env.API_URL || "http://localhost:3000",
  },
});
