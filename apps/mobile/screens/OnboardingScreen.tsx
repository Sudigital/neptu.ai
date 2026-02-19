import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { LanguagePicker } from "../components/LanguagePicker";
import {
  COLORS,
  DEFAULT_LANGUAGE,
  ANIM_FADE_DURATION,
  ANIM_SLIDE_DURATION,
  ANIM_SLIDE_DELAY_FAST,
  ANIM_SLIDE_DELAY_SLOW,
  DEFAULT_BIRTH_YEAR,
  DEFAULT_BIRTH_MONTH,
  DEFAULT_BIRTH_DAY,
  MIN_BIRTH_YEAR,
} from "../constants";
import { saveLanguage, setOnboarded } from "../services/storage";
import { onboardUser } from "../services/voice-api";

interface OnboardingScreenProps {
  walletAddress: string;
  onComplete: () => void;
}

export function OnboardingScreen({
  walletAddress,
  onComplete,
}: OnboardingScreenProps) {
  const [birthday, setBirthday] = useState<Date>(
    new Date(DEFAULT_BIRTH_YEAR, DEFAULT_BIRTH_MONTH, DEFAULT_BIRTH_DAY)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE.code);
  const [saving, setSaving] = useState(false);

  const formattedDate = birthday.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dateString = birthday.toISOString().split("T")[0];

  const handleAwaken = async () => {
    setSaving(true);
    try {
      saveLanguage(language);
      setOnboarded(true);

      // Sync to API — same endpoint as web: POST /api/users/:wallet/onboard
      await onboardUser(walletAddress, {
        birthDate: dateString,
        preferredLanguage: language,
      });

      onComplete();
    } catch {
      // Still proceed even if API sync fails — local data is saved
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(ANIM_FADE_DURATION)}
        style={styles.logoArea}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>◉</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(ANIM_SLIDE_DELAY_FAST).duration(
          ANIM_SLIDE_DURATION
        )}
        style={styles.formArea}
      >
        <Text style={styles.question}>When were you born?</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
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

        <View style={styles.spacer} />

        <LanguagePicker selected={language} onSelect={setLanguage} />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(ANIM_SLIDE_DELAY_SLOW).duration(
          ANIM_SLIDE_DURATION
        )}
        style={styles.bottomArea}
      >
        <TouchableOpacity
          style={[styles.awakenButton, saving && styles.awakenButtonDisabled]}
          onPress={handleAwaken}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.awakenText}>
            {saving ? "Awakening..." : "Awaken Neptu"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 32,
    color: COLORS.primary,
  },
  formArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  question: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 240,
    justifyContent: "center",
  },
  dateIcon: {
    fontSize: 20,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 16,
  },
  spacer: {
    height: 32,
  },
  bottomArea: {
    width: "100%",
  },
  awakenButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  awakenButtonDisabled: {
    opacity: 0.6,
  },
  awakenText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
