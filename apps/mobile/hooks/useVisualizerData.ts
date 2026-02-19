import { useMemo } from "react";
import {
  type SharedValue,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { OrbState } from "../types";

import {
  ORB_SIZE,
  ORB_IDLE_SCALE,
  ORB_IDLE_PULSE_SCALE,
  ORB_LISTENING_SCALE_MIN,
  ORB_LISTENING_SCALE_MAX,
  ORB_LISTENING_SPRING_DAMPING,
  ORB_LISTENING_SPRING_STIFFNESS,
  ORB_LISTENING_GLOW_BASE,
  ORB_LISTENING_GLOW_RANGE,
  ORB_THINKING_SCALE,
  ORB_THINKING_DURATION,
  ORB_THINKING_ROTATION,
  ORB_THINKING_ROTATION_SPEED,
  ORB_THINKING_GLOW,
  ORB_SPEAKING_AMPLITUDE_FACTOR,
  ORB_SPEAKING_SPRING_DAMPING,
  ORB_SPEAKING_SPRING_STIFFNESS,
  ORB_SPEAKING_GLOW_BASE,
  ORB_SPEAKING_GLOW_RANGE,
  ORB_ERROR_SCALE,
  ORB_ERROR_GLOW,
  ORB_ERROR_DURATION,
  ORB_IDLE_GLOW,
  ORB_INITIAL_GLOW,
  ORB_PULSE_DURATION,
  COLORS,
} from "../constants";

interface UseVisualizerDataReturn {
  scale: SharedValue<number>;
  glowRadius: SharedValue<number>;
  rotation: SharedValue<number>;
  color: string;
  orbSize: number;
}

export function useVisualizerData(
  orbState: OrbState,
  amplitude: number
): UseVisualizerDataReturn {
  const scale = useSharedValue(ORB_IDLE_SCALE);
  const glowRadius = useSharedValue(ORB_INITIAL_GLOW);
  const rotation = useSharedValue(0);

  const color = useMemo(() => {
    switch (orbState) {
      case "listening":
        return COLORS.orbListening;
      case "thinking":
        return COLORS.orbThinking;
      case "speaking":
        return COLORS.orbSpeaking;
      case "error":
        return COLORS.orbError;
      default:
        return COLORS.orbIdle;
    }
  }, [orbState]);

  useDerivedValue(() => {
    switch (orbState) {
      case "idle":
        scale.value = withRepeat(
          withTiming(ORB_IDLE_PULSE_SCALE, { duration: ORB_PULSE_DURATION }),
          -1,
          true
        );
        glowRadius.value = withRepeat(
          withTiming(ORB_IDLE_GLOW, { duration: ORB_PULSE_DURATION }),
          -1,
          true
        );
        rotation.value = 0;
        break;

      case "listening": {
        const mappedScale =
          ORB_LISTENING_SCALE_MIN +
          amplitude * (ORB_LISTENING_SCALE_MAX - ORB_LISTENING_SCALE_MIN);
        scale.value = withSpring(mappedScale, {
          damping: ORB_LISTENING_SPRING_DAMPING,
          stiffness: ORB_LISTENING_SPRING_STIFFNESS,
        });
        glowRadius.value = withSpring(
          ORB_LISTENING_GLOW_BASE + amplitude * ORB_LISTENING_GLOW_RANGE
        );
        break;
      }

      case "thinking":
        scale.value = withRepeat(
          withTiming(ORB_THINKING_SCALE, { duration: ORB_THINKING_DURATION }),
          -1,
          true
        );
        rotation.value = withRepeat(
          withTiming(ORB_THINKING_ROTATION, {
            duration: ORB_THINKING_ROTATION_SPEED,
          }),
          -1,
          false
        );
        glowRadius.value = withRepeat(
          withTiming(ORB_THINKING_GLOW, { duration: ORB_THINKING_DURATION }),
          -1,
          true
        );
        break;

      case "speaking": {
        const speakScale =
          ORB_IDLE_SCALE + amplitude * ORB_SPEAKING_AMPLITUDE_FACTOR;
        scale.value = withSpring(speakScale, {
          damping: ORB_SPEAKING_SPRING_DAMPING,
          stiffness: ORB_SPEAKING_SPRING_STIFFNESS,
        });
        glowRadius.value = withSpring(
          ORB_SPEAKING_GLOW_BASE + amplitude * ORB_SPEAKING_GLOW_RANGE
        );
        rotation.value = 0;
        break;
      }

      case "error":
        scale.value = withSpring(ORB_ERROR_SCALE);
        glowRadius.value = withTiming(ORB_ERROR_GLOW, {
          duration: ORB_ERROR_DURATION,
        });
        rotation.value = 0;
        break;
    }
  });

  return {
    scale,
    glowRadius,
    rotation,
    color,
    orbSize: ORB_SIZE,
  };
}
