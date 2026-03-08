import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { Screen, MainTab } from "./types";

import { BottomTabBar } from "./components/BottomTabBar";
import { useSolanaWallet } from "./hooks/useSolanaWallet";
import { ThemeContext, useThemeProvider } from "./hooks/useTheme";
import { ARScreen } from "./screens/ARScreen";
import { ConnectScreen } from "./screens/ConnectScreen";
import { HabitScreen } from "./screens/HabitScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { isOnboarded, getProfile, clearAll } from "./services/storage";

const GUEST_ADDRESS = "GUEST_MODE";

export default function App() {
  const wallet = useSolanaWallet();
  const theme = useThemeProvider();
  const [screen, setScreen] = useState<Screen>("connect");
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [isGuest, setIsGuest] = useState(false);
  const [hideTabBar, setHideTabBar] = useState(false);

  const handleConnect = useCallback(async () => {
    const address = await wallet.connect();
    if (address) {
      setIsGuest(false);
      // Only skip onboarding when profile has birthDate — prevents hero
      // cards showing "--" for potensi when onboarded flag is set but
      // birthDate was never persisted to MMKV.
      const ready = isOnboarded() && !!getProfile()?.birthDate;
      setScreen(ready ? "main" : "onboarding");
    }
    return address;
  }, [wallet]);

  const handleGuestMode = useCallback(() => {
    setIsGuest(true);
    setScreen("onboarding");
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setScreen("main");
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (!isGuest) {
      await wallet.disconnect();
    }
    setIsGuest(false);
    clearAll();
    setActiveTab("home");
    setScreen("connect");
  }, [wallet, isGuest]);

  const activeAddress = isGuest ? GUEST_ADDRESS : wallet.walletAddress;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        {screen === "connect" && (
          <ConnectScreen
            onConnect={handleConnect}
            onGuestMode={handleGuestMode}
            isConnecting={wallet.isConnecting}
            error={wallet.error}
          />
        )}
        {screen === "onboarding" && activeAddress && (
          <OnboardingScreen
            walletAddress={activeAddress}
            onComplete={handleOnboardingComplete}
          />
        )}
        {screen === "main" && activeAddress && (
          <View style={styles.mainContainer}>
            <View style={styles.screenContainer}>
              {activeTab === "home" && (
                <HomeScreen walletAddress={activeAddress} />
              )}
              {activeTab === "calendar" && (
                <HabitScreen walletAddress={activeAddress} />
              )}
              {activeTab === "ar" && (
                <ARScreen
                  walletAddress={activeAddress}
                  onSubScreenChange={setHideTabBar}
                />
              )}
              {activeTab === "wallet" && (
                <WalletScreen walletAddress={activeAddress} />
              )}
              {activeTab === "profile" && (
                <ProfileScreen
                  walletAddress={activeAddress}
                  onDisconnect={handleDisconnect}
                />
              )}
            </View>
            {!hideTabBar && (
              <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
            )}
          </View>
        )}
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  screenContainer: { flex: 1 },
});
