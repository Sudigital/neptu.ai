import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

import { COLORS, SUPPORTED_LANGUAGES } from "../constants";

interface LanguagePickerProps {
  selected: string;
  onSelect: (code: string) => void;
}

export function LanguagePicker({ selected, onSelect }: LanguagePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose your language</Text>
      <View style={styles.grid}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.item, selected === lang.code && styles.itemActive]}
            onPress={() => onSelect(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text
              style={[styles.name, selected === lang.code && styles.nameActive]}
              numberOfLines={1}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 24,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    minWidth: 130,
  },
  itemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
    borderWidth: 1,
  },
  flag: {
    fontSize: 22,
  },
  name: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  nameActive: {
    color: COLORS.text,
    fontWeight: "600",
  },
});
