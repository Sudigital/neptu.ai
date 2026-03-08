import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Switch,
  ScrollView,
} from "react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

import {
  COLORS,
  SUPPORTED_LANGUAGES,
  MIN_BIRTH_YEAR,
  DEFAULT_BIRTH_YEAR,
  DEFAULT_BIRTH_MONTH,
  DEFAULT_BIRTH_DAY,
} from "../constants";
import {
  getLanguage,
  saveLanguage,
  getProfile,
  saveProfile,
  getAutoPlayAudio,
  saveAutoPlayAudio,
} from "../services/storage";
import { onboardUser, updateUserProfile } from "../services/voice-api";
import { INTEREST_ICONS, INTEREST_LABELS } from "../utils/interest-helpers";

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
  const [autoPlay, setAutoPlay] = useState(getAutoPlayAudio());
  const profile = getProfile();
  const hasBirthDate = !!profile?.birthDate;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthday, setBirthday] = useState<Date>(
    hasBirthDate
      ? new Date(`${profile.birthDate}T00:00:00`)
      : new Date(DEFAULT_BIRTH_YEAR, DEFAULT_BIRTH_MONTH, DEFAULT_BIRTH_DAY)
  );
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [showBirthDate, setShowBirthDate] = useState(false);

  const MAX_INTERESTS = 3;
  const ALL_INTERESTS = Object.keys(INTEREST_LABELS);
  const [interests, setInterests] = useState<string[]>(
    profile?.interests ?? []
  );
  const savingRef = useRef(false);

  const persistInterests = useCallback(
    async (next: string[]) => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        const existing = getProfile();
        if (existing) {
          saveProfile({ ...existing, interests: next });
        }
        await updateUserProfile(walletAddress, { interests: next });
      } catch {
        // Non-critical
      } finally {
        savingRef.current = false;
      }
    },
    [walletAddress]
  );

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      let next: string[];
      if (prev.includes(interest)) {
        next = prev.filter((i) => i !== interest);
      } else if (prev.length < MAX_INTERESTS) {
        next = [...prev, interest];
      } else {
        return prev;
      }
      persistInterests(next);
      return next;
    });
  };

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

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Birthday</Text>
            {hasBirthDate ? (
              <>
                <TouchableOpacity
                  style={styles.lockedRow}
                  onPress={() => setShowBirthDate(!showBirthDate)}
                >
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.value}>
                    {showBirthDate ? profile.birthDate : "••••••••••"}
                  </Text>
                  <Text style={styles.eyeIcon}>
                    {showBirthDate ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.lockedHint}>
                  Birth date is locked for accurate Wuku readings.
                </Text>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateIcon}>📅</Text>
                  <Text style={styles.value}>
                    {birthday.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={birthday}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    minimumDate={new Date(MIN_BIRTH_YEAR, 0, 1)}
                    onChange={(_, date) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setBirthday(date);
                    }}
                    themeVariant="dark"
                  />
                )}
                <Text style={styles.warningText}>
                  ⚠️ Once saved, your birth date cannot be changed.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.saveBirthdayButton,
                    savingBirthday && styles.saveBirthdayDisabled,
                  ]}
                  onPress={async () => {
                    setSavingBirthday(true);
                    try {
                      const dateString = birthday.toISOString().split("T")[0];
                      try {
                        await onboardUser(walletAddress, {
                          birthDate: dateString,
                          preferredLanguage: selectedLang,
                        });
                      } catch {
                        // API unavailable or guest mode — continue to save locally
                      }
                      const existing = getProfile();
                      saveProfile({
                        id: existing?.id ?? "",
                        walletAddress: existing?.walletAddress ?? walletAddress,
                        email: existing?.email ?? null,
                        displayName: existing?.displayName ?? null,
                        birthDate: dateString,
                        preferredLanguage:
                          existing?.preferredLanguage ?? selectedLang,
                        interests: existing?.interests ?? [],
                        onboarded: existing?.onboarded ?? true,
                        role: existing?.role ?? "user",
                        createdAt:
                          existing?.createdAt ?? new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      });
                    } finally {
                      setSavingBirthday(false);
                    }
                  }}
                  disabled={savingBirthday}
                >
                  <Text style={styles.saveBirthdayText}>
                    {savingBirthday ? "Saving..." : "Save Birthday"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
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

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Interests ({interests.length}/{MAX_INTERESTS})
            </Text>
            <Text style={styles.modeHint}>
              Pick up to {MAX_INTERESTS} to personalise your readings
            </Text>
          </View>

          <View style={styles.interestsGrid}>
            {ALL_INTERESTS.map((key) => {
              const selected = interests.includes(key);
              const disabled = !selected && interests.length >= MAX_INTERESTS;
              const meta = INTEREST_ICONS[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.interestChip,
                    selected && styles.interestChipActive,
                    disabled && styles.interestChipDisabled,
                  ]}
                  onPress={() => toggleInterest(key)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={styles.interestEmoji}>{meta?.icon}</Text>
                  <Text
                    style={[
                      styles.interestLabel,
                      selected && styles.interestLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {INTEREST_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Auto-play audio toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Auto-play Response</Text>
              <Switch
                value={autoPlay}
                onValueChange={(val) => {
                  setAutoPlay(val);
                  saveAutoPlayAudio(val);
                }}
                trackColor={{
                  false: COLORS.surfaceLight,
                  true: COLORS.primary,
                }}
                thumbColor={COLORS.text}
              />
            </View>
            <Text style={styles.modeHint}>
              {autoPlay
                ? "Oracle response plays automatically"
                : "Use the play button to hear responses"}
            </Text>
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
        </ScrollView>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
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
  backText: { color: COLORS.textSecondary, fontSize: 16 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "600" },
  section: { marginBottom: 16 },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: { color: COLORS.text, fontSize: 16 },
  valueMono: { color: COLORS.text, fontSize: 16, fontFamily: "monospace" },
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
  langButtonActive: { backgroundColor: COLORS.primary },
  langFlag: { fontSize: 16 },
  langLabel: { color: COLORS.textSecondary, fontSize: 12 },
  langLabelActive: { color: COLORS.text, fontWeight: "600" },
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
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lockIcon: { fontSize: 14 },
  eyeIcon: { fontSize: 14, marginLeft: 8 },
  lockedHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  dateIcon: { fontSize: 16 },
  warningText: {
    color: COLORS.warning,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  saveBirthdayButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 8,
  },
  saveBirthdayDisabled: { opacity: 0.6 },
  saveBirthdayText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  modeHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontStyle: "italic",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: "transparent",
  },
  interestChipActive: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderColor: COLORS.primary,
  },
  interestChipDisabled: { opacity: 0.35 },
  interestEmoji: { fontSize: 15 },
  interestLabel: { color: COLORS.textSecondary, fontSize: 12 },
  interestLabelActive: { color: COLORS.text, fontWeight: "600" },
});
