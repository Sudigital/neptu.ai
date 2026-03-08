import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBanner } from "../components/ErrorBanner";
import {
  DEFAULT_BIRTH_YEAR,
  DEFAULT_BIRTH_MONTH,
  DEFAULT_BIRTH_DAY,
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
import {
  AboutCard,
  BirthdayCard,
  InterestsCard,
  LanguageCard,
  NetworkCard,
  PreferencesCard,
} from "./ProfileCards";
import { s } from "./ProfileScreenStyles";

const SHORT_ADDR_PREFIX = 4;
const SHORT_ADDR_SUFFIX = 4;
const DISCONNECT_ANIM_DELAY = 700;
const NETWORK_ANIM_DELAY = 600;
const ABOUT_ANIM_DELAY = 650;
const MAX_INTERESTS = 3;

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
  const [profile, setProfile] = useState(getProfile());
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
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile?.interests ?? []
  );
  const [savingInterests, setSavingInterests] = useState(false);

  const shortAddress = `${walletAddress.slice(0, SHORT_ADDR_PREFIX)}...${walletAddress.slice(-SHORT_ADDR_SUFFIX)}`;
  const displayName = profile?.displayName ?? "Seeker";

  const handleLanguageChange = async (code: string) => {
    setSelectedLang(code);
    saveLanguage(code);
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
      const result = await updateUserProfile(walletAddress, {
        birthDate: dateString,
        preferredLanguage: selectedLang,
      });
      if (result?.user) {
        saveProfile(result.user);
        setProfile(result.user);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save birthday";
      setApiError(msg);
    } finally {
      setSavingBirthday(false);
    }
  };

  const handleToggleInterest = async (interest: string) => {
    const isSelected = selectedInterests.includes(interest);
    if (!isSelected && selectedInterests.length >= MAX_INTERESTS) return;

    const next = isSelected
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];

    setSelectedInterests(next);
    setSavingInterests(true);
    try {
      const result = await updateUserProfile(walletAddress, {
        interests: next,
      });
      if (result?.user) {
        saveProfile(result.user);
        setProfile(result.user);
      }
    } catch (err) {
      setSelectedInterests(selectedInterests);
      const msg =
        err instanceof Error ? err.message : "Failed to save interests";
      setApiError(msg);
    } finally {
      setSavingInterests(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)} style={s.headerSection}>
          <Text style={[s.screenTitle, { color: colors.text }]}>Profile</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <View
            style={[
              s.card,
              {
                backgroundColor: isDark ? "#1A1040" : "#EDE9FE",
                borderColor: isDark ? "#7C3AED40" : "#C4B5FD",
              },
            ]}
          >
            <View style={s.avatarRow}>
              <View
                style={[s.avatar, { backgroundColor: `${colors.primary}20` }]}
              >
                <Text style={s.avatarText}>👤</Text>
              </View>
              <View style={s.avatarInfo}>
                <Text
                  style={[
                    s.nameText,
                    { color: isDark ? "#F5F3FF" : "#4C1D95" },
                  ]}
                >
                  {displayName}
                </Text>
                <Text
                  style={[
                    s.addressText,
                    { color: isDark ? "#A78BFA" : "#7C3AED" },
                  ]}
                >
                  {shortAddress}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <BirthdayCard
            colors={colors}
            hasBirthDate={hasBirthDate}
            birthDateStr={profile?.birthDate ?? ""}
            showBirthDate={showBirthDate}
            setShowBirthDate={setShowBirthDate}
            birthday={birthday}
            setBirthday={setBirthday}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            savingBirthday={savingBirthday}
            onSave={handleSaveBirthday}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <InterestsCard
            colors={colors}
            isDark={isDark}
            selectedInterests={selectedInterests}
            savingInterests={savingInterests}
            onToggle={handleToggleInterest}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <PreferencesCard
            colors={colors}
            isDark={isDark}
            autoPlay={autoPlay}
            onThemeToggle={toggle}
            onAutoPlayChange={(val) => {
              setAutoPlay(val);
              saveAutoPlayAudio(val);
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <LanguageCard
            colors={colors}
            selectedLang={selectedLang}
            onLanguageChange={handleLanguageChange}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(NETWORK_ANIM_DELAY).duration(400)}
        >
          <NetworkCard
            colors={colors}
            isDark={isDark}
            shortAddress={shortAddress}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(ABOUT_ANIM_DELAY).duration(400)}
        >
          <AboutCard colors={colors} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(DISCONNECT_ANIM_DELAY).duration(400)}
        >
          <TouchableOpacity
            style={[s.disconnectButton, { borderColor: colors.error }]}
            onPress={onDisconnect}
          >
            <Text style={[s.disconnectText, { color: colors.error }]}>
              Disconnect Wallet
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
