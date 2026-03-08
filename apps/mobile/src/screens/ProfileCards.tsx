import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, Switch, Text, TouchableOpacity, View } from "react-native";

import { MIN_BIRTH_YEAR, SUPPORTED_LANGUAGES } from "../constants";
import { INTEREST_ICONS, INTEREST_LABELS } from "../utils/interest-helpers";
import { s } from "./ProfileScreenStyles";

const MAX_INTERESTS = 3;
const ALL_INTERESTS = Object.keys(INTEREST_LABELS);

function chipBg(
  isSelected: boolean,
  isDark: boolean,
  bg: string,
  mutedColor: string,
  surfaceLight: string
): string {
  if (isSelected) return isDark ? `${bg}30` : bg;
  return isDark ? `${mutedColor}10` : surfaceLight;
}

function chipBorder(isSelected: boolean, isDark: boolean, bg: string): string {
  if (!isSelected) return "transparent";
  return isDark ? `${bg}60` : bg;
}

function chipTextColor(
  isSelected: boolean,
  isDark: boolean,
  secondaryColor: string
): string {
  if (!isSelected) return secondaryColor;
  return isDark ? "#F5F3FF" : "#4C1D95";
}

interface ThemeColors {
  text: string;
  textMuted: string;
  textSecondary: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  error: string;
}

interface BirthdayCardProps {
  colors: ThemeColors;
  hasBirthDate: boolean;
  birthDateStr: string;
  showBirthDate: boolean;
  setShowBirthDate: (v: boolean) => void;
  birthday: Date;
  setBirthday: (d: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  savingBirthday: boolean;
  onSave: () => void;
}

export function BirthdayCard({
  colors,
  hasBirthDate,
  birthDateStr,
  showBirthDate,
  setShowBirthDate,
  birthday,
  setBirthday,
  showDatePicker,
  setShowDatePicker,
  savingBirthday,
  onSave,
}: BirthdayCardProps) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <Text style={[s.cardTitle, { color: colors.text }]}>Birthday</Text>
      {hasBirthDate ? (
        <>
          <TouchableOpacity
            style={s.lockedRow}
            onPress={() => setShowBirthDate(!showBirthDate)}
          >
            <Text style={s.lockIcon}>🔒</Text>
            <Text style={[s.settingValue, { color: colors.text }]}>
              {showBirthDate ? birthDateStr : "••••••••••"}
            </Text>
            <Text style={s.eyeIcon}>{showBirthDate ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
          <Text style={[s.hint, { color: colors.textMuted }]}>
            Birth date is locked for accurate Wuku readings.
          </Text>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={[s.dateButton, { backgroundColor: colors.surfaceLight }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={s.dateIcon}>📅</Text>
            <Text style={[s.settingValue, { color: colors.text }]}>
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
          <Text style={[s.warning, { color: colors.error }]}>
            ⚠️ Once saved, your birth date cannot be changed.
          </Text>
          <TouchableOpacity
            style={[
              s.actionButton,
              {
                backgroundColor: colors.primary,
                opacity: savingBirthday ? 0.6 : 1,
              },
            ]}
            onPress={onSave}
            disabled={savingBirthday}
          >
            <Text style={s.actionButtonText}>
              {savingBirthday ? "Saving..." : "Save Birthday"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

interface InterestsCardProps {
  colors: ThemeColors;
  isDark: boolean;
  selectedInterests: string[];
  savingInterests: boolean;
  onToggle: (interest: string) => void;
}

export function InterestsCard({
  colors,
  isDark,
  selectedInterests,
  savingInterests,
  onToggle,
}: InterestsCardProps) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <View style={s.cardTitleRow}>
        <Text style={[s.cardTitle, { color: colors.text, marginBottom: 0 }]}>
          Interests
        </Text>
        <Text style={[s.interestCount, { color: colors.textMuted }]}>
          {selectedInterests.length}/{MAX_INTERESTS}
        </Text>
      </View>
      <Text style={[s.cardSubtitle, { color: colors.textMuted }]}>
        Choose up to {MAX_INTERESTS} topics for personalized oracle insights
      </Text>
      <View style={s.interestGrid}>
        {ALL_INTERESTS.map((interest) => {
          const cfg = INTEREST_ICONS[interest];
          const label = INTEREST_LABELS[interest];
          const isSelected = selectedInterests.includes(interest);
          const isDisabled =
            !isSelected && selectedInterests.length >= MAX_INTERESTS;
          const bg = cfg?.bg ?? "#EDE9FE";
          return (
            <TouchableOpacity
              key={interest}
              style={[
                s.interestChip,
                {
                  backgroundColor: chipBg(
                    isSelected,
                    isDark,
                    bg,
                    colors.textMuted,
                    colors.surfaceLight
                  ),
                  borderColor: chipBorder(isSelected, isDark, bg),
                  opacity: isDisabled ? 0.4 : 1,
                },
              ]}
              onPress={() => onToggle(interest)}
              disabled={isDisabled || savingInterests}
              activeOpacity={0.7}
            >
              <Text style={s.interestIcon}>{cfg?.icon ?? "✨"}</Text>
              <Text
                style={[
                  s.interestLabel,
                  {
                    color: chipTextColor(
                      isSelected,
                      isDark,
                      colors.textSecondary
                    ),
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface PreferencesCardProps {
  colors: ThemeColors;
  isDark: boolean;
  autoPlay: boolean;
  onThemeToggle: () => void;
  onAutoPlayChange: (val: boolean) => void;
}

export function PreferencesCard({
  colors,
  isDark,
  autoPlay,
  onThemeToggle,
  onAutoPlayChange,
}: PreferencesCardProps) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <Text style={[s.cardTitle, { color: colors.text }]}>Preferences</Text>
      <View style={s.toggleRow}>
        <Text style={[s.settingLabel, { color: colors.textSecondary }]}>
          {isDark ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </Text>
        <Switch
          value={isDark}
          onValueChange={onThemeToggle}
          trackColor={{ false: colors.surfaceLight, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>
      <View style={[s.toggleRow, { marginTop: 12 }]}>
        <View>
          <Text style={[s.settingLabel, { color: colors.textSecondary }]}>
            🔊 Auto-play Response
          </Text>
          <Text style={[s.hint, { color: colors.textMuted }]}>
            {autoPlay ? "Plays automatically" : "Use play button"}
          </Text>
        </View>
        <Switch
          value={autoPlay}
          onValueChange={onAutoPlayChange}
          trackColor={{ false: colors.surfaceLight, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>
    </View>
  );
}

interface LanguageCardProps {
  colors: ThemeColors;
  selectedLang: string;
  onLanguageChange: (code: string) => void;
}

export function LanguageCard({
  colors,
  selectedLang,
  onLanguageChange,
}: LanguageCardProps) {
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <Text style={[s.cardTitle, { color: colors.text }]}>Language</Text>
      <Text style={[s.currentLang, { color: colors.textSecondary }]}>
        {currentLang?.flag} {currentLang?.label}
      </Text>
      <View style={s.langGrid}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = selectedLang === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                s.langButton,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceLight,
                },
              ]}
              onPress={() => onLanguageChange(lang.code)}
            >
              <Text style={s.langFlag}>{lang.flag}</Text>
              <Text
                style={[
                  s.langLabel,
                  { color: isActive ? "#FFFFFF" : colors.textSecondary },
                  isActive && s.langLabelActive,
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
  );
}

interface InfoCardsProps {
  colors: ThemeColors;
  isDark: boolean;
  shortAddress: string;
}

export function NetworkCard({ colors, isDark, shortAddress }: InfoCardsProps) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <Text style={[s.cardTitle, { color: colors.text }]}>
        Network & Wallet
      </Text>
      <View style={s.infoRow}>
        <Text style={[s.settingLabel, { color: colors.textSecondary }]}>
          Network
        </Text>
        <View
          style={[
            s.networkBadge,
            { backgroundColor: isDark ? "#064E3B" : "#D1FAE5" },
          ]}
        >
          <Text
            style={[
              s.networkBadgeText,
              { color: isDark ? "#6EE7B7" : "#065F46" },
            ]}
          >
            Devnet
          </Text>
        </View>
      </View>
      <View style={s.infoRow}>
        <Text style={[s.settingLabel, { color: colors.textSecondary }]}>
          Wallet
        </Text>
        <Text style={[s.settingValueMono, { color: colors.text }]}>
          {shortAddress}
        </Text>
      </View>
    </View>
  );
}

interface AboutCardProps {
  colors: ThemeColors;
}

export function AboutCard({ colors }: AboutCardProps) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <Text style={[s.cardTitle, { color: colors.text }]}>About</Text>
      <View style={s.infoRow}>
        <Text style={[s.settingLabel, { color: colors.textSecondary }]}>
          App
        </Text>
        <Text style={[s.settingValue, { color: colors.text }]}>Neptu</Text>
      </View>
      <View style={s.infoRow}>
        <Text style={[s.settingLabel, { color: colors.textSecondary }]}>
          Version
        </Text>
        <Text style={[s.settingValue, { color: colors.text }]}>1.0.0</Text>
      </View>
      <View style={s.infoRow}>
        <Text style={[s.settingLabel, { color: colors.textSecondary }]}>
          Built for
        </Text>
        <Text style={[s.settingValue, { color: colors.text }]}>
          Solana Mobile
        </Text>
      </View>
    </View>
  );
}
