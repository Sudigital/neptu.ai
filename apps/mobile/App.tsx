import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";

import type { Screen } from "./types";

import { useSolanaWallet } from "./hooks/useSolanaWallet";
import { ConnectScreen } from "./screens/ConnectScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { OracleScreen } from "./screens/OracleScreen";
import { isOnboarded, clearAll } from "./services/storage";

export default function App() {
  const wallet = useSolanaWallet();
  const [screen, setScreen] = useState<Screen>("connect");

  const handleConnect = useCallback(async () => {
    const address = await wallet.connect();
    if (address) {
      setScreen(isOnboarded() ? "oracle" : "onboarding");
    }
    return address;
  }, [wallet]);

  const handleOnboardingComplete = useCallback(() => {
    setScreen("oracle");
  }, []);

  const handleDisconnect = useCallback(async () => {
    await wallet.disconnect();
    clearAll();
    setScreen("connect");
  }, [wallet]);

  return (
    <>
      <StatusBar style="light" />
      {screen === "connect" && (
        <ConnectScreen
          onConnect={handleConnect}
          isConnecting={wallet.isConnecting}
          error={wallet.error}
        />
      )}
      {screen === "onboarding" && wallet.walletAddress && (
        <OnboardingScreen
          walletAddress={wallet.walletAddress}
          onComplete={handleOnboardingComplete}
        />
      )}
      {screen === "oracle" && wallet.walletAddress && (
        <OracleScreen
          walletAddress={wallet.walletAddress}
          onDisconnect={handleDisconnect}
        />
      )}
    </>
  );
}
