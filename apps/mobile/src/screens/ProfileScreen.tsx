import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBanner } from "../components/ErrorBanner";
import {
  MIN_BIRTH_YEAR,
  DEFAULT_BIRTH_YEAR,
  DEFAULT_BIRTH_MONTH,
  DEFAULT_BIRTH_DAY,
  SUPPORTED_LANGUAGES,
} from "../constants";
import { useTheme } from "../hooks/useTheme";
import {
  getLanguage,
  saveLanguage,
  getProfile,
  saveProfile,
  getAutoPlayAudio,
  saveAutoPlayAudio,
} from "../services/storage";
import { updateUserProfile } from "../services/voice-api";

const SHORT_ADDR_PREFIX = 4;
const SHORT_ADDR_SUFFIX = 4;
const DISCONNECT_ANIM_DELAY = 600;

interface ProfileScreenProps {
  walletAddress: string;
  onDisconnect: () => void;
}

export function ProfileScreen({
  walletAddress,
  onDisconnect,
}: ProfileScreenProps) {
  const { colors, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();

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
  const [apiError, setApiError] = useState<string | null>(null);

  const shortAddress = `${walletAddress.slice(0, SHORT_ADDR_PREFIX)}...${walletAddress.slice(-SHORT_ADDR_SUFFIX)}`;
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);
  const displayName = profile?.displayName ?? "Seeker";

  const handleLanguageChange = async (code: string) => {
    setSelectedLang(code);
    saveLanguage(code);
    // Sync to API — same PUT endpoint as web
    try {
      await updateUserProfile(walletAddress, { preferredLanguage: code });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to sync language";
      setApiError(msg);
    }
  };

  const handleSaveBirthday = async () => {
    setSavingBirthday(true);
    try {
      const dateString = birthday.toISOString().split("T")[0];
      // Use PUT /api/v1/users/:wallet — same endpoint as web
      const result = await updateUserProfile(walletAddress, {
        birthDate: dateString,
        preferredLanguage: selectedLang,
      });
      if (result?.user) {
        saveProfile(result.user);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save birthday";
      setApiError(msg);
    } finally {
      setSavingBirthday(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.headerSection}
        >
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            Profile
          </Text>
        </Animated.View>

        {/* Profile card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1A1040" : "#EDE9FE",
                borderColor: isDark ? "#7C3AED40" : "#C4B5FD",
              },
            ]}
          >
            <View style={styles.avatarRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <View style={styles.avatarInfo}>
                <Text
                  style={[
                    styles.nameText,
                    { color: isDark ? "#F5F3FF" : "#4C1D95" },
                  ]}
                >
                  {displayName}
                </Text>
                <Text
                  style={[
                    styles.addressText,
                    { color: isDark ? "#A78BFA" : "#7C3AED" },
                  ]}
                >
                  {shortAddress}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Birthday */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.textMuted}15`,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Birthday
            </Text>
            {hasBirthDate ? (
              <>
                <TouchableOpacity
                  style={styles.lockedRow}
                  onPress={() => setShowBirthDate(!showBirthDate)}
                >
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={[styles.settingValue, { color: colors.text }]}>
                    {showBirthDate ? profile.birthDate : "••••••••••"}
                  </Text>
                  <Text style={styles.eyeIcon}>
                    {showBirthDate ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Birth date is locked for accurate Wuku readings.
                </Text>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: colors.surfaceLight },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateIcon}>📅</Text>
                  <Text style={[styles.settingValue, { color: colors.text }]}>
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
                <Text style={[styles.warning, { color: colors.error }]}>
                  ⚠️ Once saved, your birth date cannot be changed.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: savingBirthday ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleSaveBirthday}
                  disabled={savingBirthday}
                >
                  <Text style={styles.actionButtonText}>
                    {savingBirthday ? "Saving..." : "Save Birthday"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.textMuted}15`,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Preferences
            </Text>

            {/* Theme toggle */}
            <View style={styles.toggleRow}>
              <Text
                style={[styles.settingLabel, { color: colors.textSecondary }]}
              >
                {isDark ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </Text>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{
                  false: colors.surfaceLight,
                  true: colors.primary,
                }}
                thumbColor={colors.text}
              />
            </View>

            {/* Auto-play */}
            <View style={[styles.toggleRow, { marginTop: 12 }]}>
              <View>
                <Text
                  style={[styles.settingLabel, { color: colors.textSecondary }]}
                >
                  🔊 Auto-play Response
                </Text>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  {autoPlay ? "Plays automatically" : "Use play button"}
                </Text>
              </View>
              <Switch
                value={autoPlay}
                onValueChange={(val) => {
                  setAutoPlay(val);
                  saveAutoPlayAudio(val);
                }}
                trackColor={{
                  false: colors.surfaceLight,
                  true: colors.primary,
                }}
                thumbColor={colors.text}
              />
            </View>
          </View>
        </Animated.View>

        {/* Language */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.textMuted}15`,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Language
            </Text>
            <Text style={[styles.currentLang, { color: colors.textSecondary }]}>
              {currentLang?.flag} {currentLang?.label}
            </Text>
            <View style={styles.langGrid}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = selectedLang === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langButton,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : colors.surfaceLight,
                      },
                    ]}
                    onPress={() => handleLanguageChange(lang.code)}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.langLabel,
                        { color: isActive ? "#FFFFFF" : colors.textSecondary },
                        isActive && styles.langLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Network info */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.textMuted}15`,
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Text
                style={[styles.settingLabel, { color: colors.textSecondary }]}
              >
                Network
              </Text>
              <Text style={[styles.settingValue, { color: colors.text }]}>
                Devnet
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[styles.settingLabel, { color: colors.textSecondary }]}
              >
                Wallet
              </Text>
              <Text style={[styles.settingValueMono, { color: colors.text }]}>
                {shortAddress}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Disconnect */}
        <Animated.View
          entering={FadeInUp.delay(DISCONNECT_ANIM_DELAY).duration(400)}
        >
          <TouchableOpacity
            style={[styles.disconnectButton, { borderColor: colors.error }]}
            onPress={onDisconnect}
          >
            <Text style={[styles.disconnectText, { color: colors.error }]}>
              Disconnect Wallet
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  headerSection: { paddingHorizontal: 20, marginBottom: 16 },
  screenTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 0.3 },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24 },
  avatarInfo: { flex: 1 },
  nameText: { fontSize: 20, fontWeight: "800" },
  addressText: { fontSize: 13, fontFamily: "monospace", marginTop: 2 },
  lockedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lockIcon: { fontSize: 14 },
  eyeIcon: { fontSize: 14, marginLeft: 8 },
  hint: { fontSize: 11, marginTop: 4, fontStyle: "italic" },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  dateIcon: { fontSize: 16 },
  warning: { fontSize: 11, marginTop: 6, lineHeight: 16 },
  actionButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  actionButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: { fontSize: 14, fontWeight: "500" },
  settingValue: { fontSize: 15 },
  settingValueMono: { fontSize: 14, fontFamily: "monospace" },
  currentLang: { fontSize: 14, marginBottom: 8 },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langFlag: { fontSize: 16 },
  langLabel: { fontSize: 12 },
  langLabelActive: { fontWeight: "600" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  disconnectButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  disconnectText: { fontSize: 14, fontWeight: "700" },
});
