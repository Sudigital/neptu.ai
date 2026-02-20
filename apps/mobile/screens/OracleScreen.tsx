import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { MicButton } from "../components/MicButton";
import { NeptuOrb } from "../components/NeptuOrb";
import { SettingsPanel } from "../components/SettingsPanel";
import { WalletPanel } from "../components/WalletPanel";
import { COLORS } from "../constants";
import { useNeptuOracle } from "../hooks/useNeptuOracle";

interface OracleScreenProps {
  walletAddress: string;
  onDisconnect: () => void;
}

const STATE_LABELS: Record<string, string> = {
  idle: "Tap to speak with Neptu",
  listening: "Listening...",
  thinking: "The cosmos is aligning...",
  speaking: "Neptu speaks...",
  error: "The connection wavers...",
};

export function OracleScreen({
  walletAddress,
  onDisconnect,
}: OracleScreenProps) {
  const [showWallet, setShowWallet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const oracle = useNeptuOracle(walletAddress);

  const handleMicPressIn = useCallback(() => {
    oracle.startConversation();
  }, [oracle]);

  const handleMicPressOut = useCallback(() => {
    oracle.stopConversation();
  }, [oracle]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={styles.topBarIcon}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.freeCounter}>
          <Text style={styles.freeCounterText}>
            {oracle.lastResponse?.cached ? "cached" : "live"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowWallet(true)}>
          <Text style={styles.topBarIcon}>💰</Text>
        </TouchableOpacity>
      </View>

      {/* Main orb area */}
      <Animated.View entering={FadeIn.duration(1000)} style={styles.orbArea}>
        <NeptuOrb orbState={oracle.orbState} amplitude={oracle.amplitude} />
      </Animated.View>

      {/* Status text */}
      <Text style={styles.statusText}>{STATE_LABELS[oracle.orbState]}</Text>

      {/* Last response preview */}
      {oracle.lastResponse && oracle.orbState === "idle" && (
        <View style={styles.responsePreview}>
          <Text style={styles.responseText} numberOfLines={3}>
            {oracle.lastResponse.response}
          </Text>
        </View>
      )}

      {/* Error */}
      {oracle.error && <Text style={styles.errorText}>{oracle.error}</Text>}

      {/* Mic button */}
      <View style={styles.micArea}>
        <MicButton
          orbState={oracle.orbState}
          onPressIn={handleMicPressIn}
          onPressOut={handleMicPressOut}
        />
      </View>

      {/* Side panels */}
      <WalletPanel
        walletAddress={walletAddress}
        visible={showWallet}
        onClose={() => setShowWallet(false)}
      />
      <SettingsPanel
        walletAddress={walletAddress}
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onDisconnect={onDisconnect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  topBarIcon: {
    fontSize: 24,
    padding: 8,
  },
  freeCounter: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  freeCounterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: "monospace",
  },
  orbArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  responsePreview: {
    marginHorizontal: 32,
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  responseText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  micArea: {
    alignItems: "center",
    paddingBottom: 48,
    paddingTop: 16,
  },
});
