import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { OrbState } from "../types";

import { COLORS } from "../constants";

interface MicButtonProps {
  orbState: OrbState;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function MicButton({ orbState, onPressIn, onPressOut }: MicButtonProps) {
  const scale = useSharedValue(1);
  const isListening = orbState === "listening";
  const isDisabled = orbState === "thinking" || orbState === "speaking";

  useEffect(() => {
    if (isListening) {
      scale.value = withRepeat(withTiming(1.1, { duration: 800 }), -1, true);
    } else {
      scale.value = withSpring(1);
    }
  }, [isListening, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressIn();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressOut();
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          isListening && styles.buttonActive,
          isDisabled && styles.buttonDisabled,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={isDisabled}
      >
        <View style={styles.iconContainer}>
          <MicIcon active={isListening} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.micIcon}>
      <View
        style={[
          styles.micBody,
          { backgroundColor: active ? COLORS.orbListening : COLORS.text },
        ]}
      />
      <View
        style={[
          styles.micBase,
          { borderColor: active ? COLORS.orbListening : COLORS.text },
        ]}
      />
      <View
        style={[
          styles.micStand,
          { backgroundColor: active ? COLORS.orbListening : COLORS.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.orbListening,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  micIcon: {
    alignItems: "center",
  },
  micBody: {
    width: 16,
    height: 22,
    borderRadius: 8,
  },
  micBase: {
    width: 24,
    height: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    marginTop: -2,
  },
  micStand: {
    width: 2,
    height: 6,
  },
});
