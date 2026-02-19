import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import {
  COLORS,
  ANIM_CONNECT_FADE_DURATION,
  ANIM_SLIDE_DURATION,
  ANIM_SLIDE_DELAY_FAST,
  ANIM_SLIDE_DELAY_MEDIUM,
  ANIM_CONNECT_DELAY_SLOW,
} from "../constants";

interface ConnectScreenProps {
  onConnect: () => Promise<string | null>;
  isConnecting: boolean;
  error: string | null;
}

export function ConnectScreen({
  onConnect,
  isConnecting,
  error,
}: ConnectScreenProps) {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(ANIM_CONNECT_FADE_DURATION)}
        style={styles.logoArea}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>◉</Text>
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
          Talk to the Cosmos. It Talks Back.
        </Animated.Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(ANIM_CONNECT_DELAY_SLOW).duration(
          ANIM_SLIDE_DURATION
        )}
        style={styles.bottomArea}
      >
        <Text style={styles.connectPrompt}>
          Connect your wallet to awaken the oracle
        </Text>

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
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.connectButtonText}>Connect with Wallet</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.poweredBy}>Powered by Solana</Text>
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
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  logoArea: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
    color: COLORS.primary,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  bottomArea: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  connectPrompt: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  connectButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: "center",
  },
  poweredBy: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
});
