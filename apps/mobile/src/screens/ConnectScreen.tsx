import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  COLORS,
  ANIM_CONNECT_FADE_DURATION,
  ANIM_SLIDE_DURATION,
  ANIM_SLIDE_DELAY_FAST,
  ANIM_SLIDE_DELAY_MEDIUM,
  ANIM_CONNECT_DELAY_SLOW,
} from "../constants";
import { useTranslate } from "../hooks/useTranslate";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const neptuLogo = require("../../assets/icon.png") as number;

interface ConnectScreenProps {
  onConnect: () => Promise<string | null>;
  onGuestMode: () => void;
  isConnecting: boolean;
  error: string | null;
}

export function ConnectScreen({
  onConnect,
  onGuestMode,
  isConnecting,
  error,
}: ConnectScreenProps) {
  const insets = useSafeAreaInsets();
  const t = useTranslate();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Animated.View
        entering={FadeIn.duration(ANIM_CONNECT_FADE_DURATION)}
        style={styles.logoArea}
      >
        <View style={styles.logoGlow}>
          <Image source={neptuLogo} style={styles.logoImage} />
        </View>
        <Animated.Text
          entering={FadeInUp.delay(ANIM_SLIDE_DELAY_FAST).duration(
            ANIM_SLIDE_DURATION
          )}
          style={styles.title}
        >
          NEPTU
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(ANIM_SLIDE_DELAY_MEDIUM).duration(
            ANIM_SLIDE_DURATION
          )}
          style={styles.subtitle}
        >
          {t("connect.subtitle")}
        </Animated.Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(ANIM_CONNECT_DELAY_SLOW).duration(
          ANIM_SLIDE_DURATION
        )}
        style={styles.bottomArea}
      >
        <Text style={styles.connectPrompt}>{t("connect.prompt")}</Text>

        <TouchableOpacity
          style={[
            styles.connectButton,
            isConnecting && styles.connectButtonDisabled,
          ]}
          onPress={onConnect}
          disabled={isConnecting}
          activeOpacity={0.8}
        >
          {isConnecting ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.connectButtonText}>{t("connect.button")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={onGuestMode}
          disabled={isConnecting}
          activeOpacity={0.8}
        >
          <Text style={styles.guestButtonText}>{t("connect.guest")}</Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.poweredBy}>{t("connect.powered")}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoArea: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logoGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 12,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  bottomArea: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  connectPrompt: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 20,
  },
  connectButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  guestButton: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${COLORS.textMuted}60`,
    paddingVertical: 16,
    alignItems: "center",
  },
  guestButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: "center",
  },
  poweredBy: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
