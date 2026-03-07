import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { MainTab } from "../types";

import { useTheme } from "../hooks/useTheme";

const TAB_ICON_SIZE = 24;
export const TAB_BAR_HEIGHT = 56;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  key: MainTab;
  icon: IoniconsName;
  iconActive: IoniconsName;
  label: string;
}

const TABS: TabConfig[] = [
  { key: "home", icon: "flash-outline", iconActive: "flash", label: "Home" },
  {
    key: "calendar",
    icon: "calendar-outline",
    iconActive: "calendar",
    label: "Habits",
  },
  { key: "ar", icon: "scan-outline", iconActive: "scan", label: "AR" },
  {
    key: "wallet",
    icon: "wallet-outline",
    iconActive: "wallet",
    label: "Wallet",
  },
  {
    key: "profile",
    icon: "person-outline",
    iconActive: "person",
    label: "Profile",
  },
];

interface BottomTabBarProps {
  activeTab: MainTab;
  onTabPress: (tab: MainTab) => void;
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const { colors } = useTheme();

  const renderTab = useCallback(
    (tab: TabConfig) => {
      const isActive = activeTab === tab.key;
      const tintColor = isActive ? colors.primary : colors.textMuted;

      return (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            isActive && {
              backgroundColor: `${colors.primary}18`,
              borderRadius: 16,
            },
          ]}
          onPress={() => onTabPress(tab.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isActive ? tab.iconActive : tab.icon}
            size={TAB_ICON_SIZE}
            color={tintColor}
          />
          <Text style={[styles.tabLabel, { color: tintColor }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeTab, colors, onTabPress]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${colors.surface}CC`,
          borderColor: `${colors.textMuted}18`,
        },
      ]}
    >
      {TABS.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    width: "80%",
    left: "10%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    borderRadius: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 8,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
    zIndex: 50,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "500",
    marginTop: 1,
  },
});
