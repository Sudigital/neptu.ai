import { Canvas, Circle, Group, Shadow } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { OrbState } from "../types";

import { COLORS } from "../constants";
import { useVisualizerData } from "../hooks/useVisualizerData";

interface NeptuOrbProps {
  orbState: OrbState;
  amplitude: number;
}

export function NeptuOrb({ orbState, amplitude }: NeptuOrbProps) {
  const { scale, rotation, color, orbSize } = useVisualizerData(
    orbState,
    amplitude
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value as number },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const canvasSize = orbSize + 80; // Extra space for glow
  const center = canvasSize / 2;
  const radius = orbSize / 2;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.orbWrapper, animatedContainerStyle]}>
        <Canvas style={{ width: canvasSize, height: canvasSize }}>
          {/* Outer glow */}
          <Circle
            cx={center}
            cy={center}
            r={radius + 10}
            color={color}
            opacity={0.15}
          >
            <Shadow dx={0} dy={0} blur={40} color={color} />
          </Circle>

          {/* Main orb body */}
          <Group>
            <Circle cx={center} cy={center} r={radius} color={COLORS.surface}>
              <Shadow dx={0} dy={0} blur={20} color={color} />
            </Circle>

            {/* Inner gradient ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius - 2}
              color={color}
              opacity={0.2}
              style="stroke"
              strokeWidth={3}
            />

            {/* Center highlight */}
            <Circle
              cx={center}
              cy={center - radius * 0.15}
              r={radius * 0.4}
              color={color}
              opacity={0.08}
            />
          </Group>

          {/* Waveform ring (visible during listening/speaking) */}
          {(orbState === "listening" || orbState === "speaking") && (
            <Circle
              cx={center}
              cy={center}
              r={radius + 15 + amplitude * 20}
              color={color}
              opacity={0.3 + amplitude * 0.3}
              style="stroke"
              strokeWidth={2 + amplitude * 3}
            />
          )}
        </Canvas>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
