import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AUTO_DISMISS_MS = 6000;
const ERROR_BG = "#DC2626";
const WARNING_BG = "#D97706";
const INFO_BG = "#2563EB";

type BannerKind = "error" | "warning" | "info";

interface ErrorBannerProps {
  message: string | null;
  kind?: BannerKind;
  onDismiss?: () => void;
}

function getBg(kind: BannerKind): string {
  if (kind === "warning") return WARNING_BG;
  if (kind === "info") return INFO_BG;
  return ERROR_BG;
}

function getIcon(kind: BannerKind): string {
  if (kind === "warning") return "\u26A0\uFE0F";
  if (kind === "info") return "\u2139\uFE0F";
  return "\u274C";
}

export function ErrorBanner({
  message,
  kind = "error",
  onDismiss,
}: ErrorBannerProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message) {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, AUTO_DISMISS_MS);
    } else {
      setVisible(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, onDismiss]);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!visible || !message) return null;

  const bg = getBg(kind);
  const icon = getIcon(kind);

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        { paddingTop: insets.top + 4, backgroundColor: bg },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={handleDismiss} hitSlop={12}>
          <Text style={styles.close}>{"\u2715"}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: { fontSize: 14 },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  close: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    paddingLeft: 4,
  },
});
