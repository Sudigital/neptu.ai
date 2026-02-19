import { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

import { COLORS, SUPPORTED_LANGUAGES } from "../constants";
import { getLanguage, saveLanguage, getProfile } from "../services/storage";

interface SettingsPanelProps {
  walletAddress: string;
  visible: boolean;
  onClose: () => void;
  onDisconnect: () => void;
}

export function SettingsPanel({
  walletAddress,
  visible,
  onClose,
  onDisconnect,
}: SettingsPanelProps) {
  const [selectedLang, setSelectedLang] = useState(getLanguage());
  const profile = getProfile();

  if (!visible) return null;

  const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);

  const handleLanguageChange = (code: string) => {
    setSelectedLang(code);
    saveLanguage(code);
  };

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutRight.duration(200)}
      style={styles.overlay}
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Birthday</Text>
          <Text style={styles.value}>{profile?.birthday ?? "Not set"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>
            {currentLang?.flag} {currentLang?.label}
          </Text>
        </View>

        <View style={styles.languageGrid}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langButton,
                selectedLang === lang.code && styles.langButtonActive,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.langLabel,
                  selectedLang === lang.code && styles.langLabelActive,
                ]}
                numberOfLines={1}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Wallet</Text>
          <Text style={styles.valueMono}>{shortAddress}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Network</Text>
          <Text style={styles.value}>Devnet</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={onDisconnect}
        >
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    width: 300,
    backgroundColor: COLORS.surface,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    color: COLORS.text,
    fontSize: 16,
  },
  valueMono: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "monospace",
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  langButtonActive: {
    backgroundColor: COLORS.primary,
  },
  langFlag: {
    fontSize: 16,
  },
  langLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  langLabelActive: {
    color: COLORS.text,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
    marginVertical: 20,
  },
  disconnectButton: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  disconnectText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "600",
  },
});
