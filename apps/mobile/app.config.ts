import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Neptu",
  slug: "neptu",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0A0E1A",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0A0E1A",
    },
    package: "ai.neptu.mobile",
  },
  plugins: ["expo-av"],
};

export default config;
