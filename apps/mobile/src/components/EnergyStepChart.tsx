import {
  Canvas,
  Circle,
  DashPathEffect,
  Line as SkiaLine,
  LinearGradient,
  Path,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

// Layout
const SCREEN_PADDING = 32;
const CHART_WIDTH = Dimensions.get("window").width - SCREEN_PADDING - 32;
const Y_AXIS_WIDTH = 36;
const X_AXIS_HEIGHT = 20;
const CHART_TOP_PAD = 20;
const PLOT_WIDTH = CHART_WIDTH - Y_AXIS_WIDTH;
const PLOT_HEIGHT = 160;
const CANVAS_HEIGHT = PLOT_HEIGHT + X_AXIS_HEIGHT + CHART_TOP_PAD;

// Gradient color stop positions
const GRADIENT_STOP_1 = 0.16;
const GRADIENT_STOP_2 = 0.18;
const GRADIENT_STOP_3 = 0.52;

// Energy levels (same as web)
const HOURS_IN_DAY = 24;
const HALF_DAY = 12;
const EXTRA_HOURS = 25;
const ENERGY_HIGH = 100;
const ENERGY_MID = 66;
const ENERGY_LOW = 33;
const ENERGY_MAX = 100;
const SEED_FACTOR_URIP = 7;
const SEED_FACTOR_HOUR = 13;
const SEED_THRESHOLD_HIGH = 8;
const SEED_THRESHOLD_MID = 16;

// Colors matching web oklch values
const COLOR_EMERALD = "#10B981";
const COLOR_SKY = "#0EA5E9";
const COLOR_ROSE = "#F43F5E";

const GRID_LINE_WIDTH = 1;
const STEP_LINE_WIDTH = 2;
const DASH_LINE_WIDTH = 1;
const DASH_ON = 4;
const DASH_OFF = 3;
const DOT_RADIUS = 5;
const DOT_BORDER = 2;
const X_LABEL_INTERVAL = 4;

// Pulse animation
const PULSE_STEPS = 12;
const PULSE_INTERVAL_MS = 150;
const GLOW_BASE_R = 12;
const GLOW_RANGE_R = 6;
const GLOW_BASE_OP = 0.12;
const GLOW_RANGE_OP = 0.18;

// Timing
const SECOND_MS = 1_000;
const MINUTE_MS = 60_000;

const Y_TICKS = [0, ENERGY_LOW, ENERGY_MID, ENERGY_HIGH];

// Offset so the center line aligns with the middle of the full row (canvas + y-axis)
const PLOT_SHIFT = Math.round(Y_AXIS_WIDTH / 2);

// Center X — the purple "now" line at the horizontal midpoint of the screen
const CENTER_X = Math.round(PLOT_WIDTH / 2) + PLOT_SHIFT;

function getHourEnergy(hour: number, totalUrip: number): number {
  const seed =
    (totalUrip * SEED_FACTOR_URIP + hour * SEED_FACTOR_HOUR) % HOURS_IN_DAY;
  if (seed < SEED_THRESHOLD_HIGH) return ENERGY_HIGH;
  if (seed < SEED_THRESHOLD_MID) return ENERGY_MID;
  return ENERGY_LOW;
}

function getEnergyColor(energy: number): string {
  if (energy >= ENERGY_HIGH) return COLOR_EMERALD;
  if (energy >= ENERGY_MID) return COLOR_SKY;
  return COLOR_ROSE;
}

function getEnergyLabel(energy: number): string {
  if (energy >= ENERGY_HIGH) return "Good";
  if (energy >= ENERGY_MID) return "Neutral";
  return "Caution";
}

function energyToY(energy: number): number {
  return CHART_TOP_PAD + PLOT_HEIGHT - (energy / ENERGY_MAX) * PLOT_HEIGHT;
}

function wrapHour(h: number): number {
  return ((h % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY;
}

// Map an absolute hour to X — current time is always at CENTER_X
function timeToX(hour: number, currentTime: number): number {
  const offset = hour - currentTime;
  const fraction = (offset + HALF_DAY) / HOURS_IN_DAY;
  return fraction * PLOT_WIDTH + PLOT_SHIFT;
}

function getFractionalTime(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function formatTime(fractional: number): string {
  const h = Math.floor(fractional);
  const m = Math.floor((fractional - h) * 60);
  const now = new Date();
  const s = now.getSeconds();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface EnergyStepChartProps {
  totalUrip: number;
  isToday: boolean;
  isDark: boolean;
  gridColor: string;
  textMutedColor: string;
}

// Static full-day view for non-today dates
const STATIC_CENTER = 12;

export function EnergyStepChart({
  totalUrip,
  isToday,
  isDark,
  gridColor,
  textMutedColor,
}: EnergyStepChartProps) {
  // Live fractional time — updates every minute for smooth sliding (only when isToday)
  const [currentTime, setCurrentTime] = useState(getFractionalTime);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(
      () => setCurrentTime(getFractionalTime()),
      MINUTE_MS
    );
    return () => clearInterval(id);
  }, [isToday]);

  // Refresh seconds display every second (only when isToday)
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setTick((t) => t + 1), SECOND_MS);
    return () => clearInterval(id);
  }, [isToday]);

  // Pulsing glow animation — lightweight 12-frame sine cycle (only when isToday)
  const [pulseStep, setPulseStep] = useState(0);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(
      () => setPulseStep((s) => (s + 1) % PULSE_STEPS),
      PULSE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [isToday]);

  const pulseT = Math.sin((pulseStep / PULSE_STEPS) * Math.PI * 2) * 0.5 + 0.5;
  const glowR = GLOW_BASE_R + pulseT * GLOW_RANGE_R;
  const glowOp = GLOW_BASE_OP + pulseT * GLOW_RANGE_OP;

  // For non-today: use static center (hour 12) so full 0-23 is visible
  const effectiveTime = isToday ? currentTime : STATIC_CENTER;
  const currentHour = Math.floor(isToday ? currentTime : STATIC_CENTER);
  const currentEnergy = getHourEnergy(currentHour, totalUrip);
  const timeStr = isToday ? formatTime(currentTime) : "00:00:00";

  // Build step path + x-axis labels
  const { stepPath, xLabels } = useMemo(() => {
    const startH = Math.floor(effectiveTime - HALF_DAY);
    const endH = startH + EXTRA_HOURS;

    // Single continuous step path
    const step = Skia.Path.Make();
    const firstReal = wrapHour(startH);
    step.moveTo(
      timeToX(startH, effectiveTime),
      energyToY(getHourEnergy(firstReal, totalUrip))
    );

    for (let h = startH + 1; h <= endH; h++) {
      const prevE = getHourEnergy(wrapHour(h - 1), totalUrip);
      const currE = getHourEnergy(wrapHour(h), totalUrip);
      const x = timeToX(h, effectiveTime);
      step.lineTo(x, energyToY(prevE));
      step.lineTo(x, energyToY(currE));
    }

    // X-axis labels (only those within visible area)
    const labels: Array<{ hour: number; x: number; key: number }> = [];
    for (let h = startH; h <= endH; h++) {
      const real = wrapHour(h);
      if (real % X_LABEL_INTERVAL !== 0) continue;
      const x = timeToX(h, effectiveTime);
      if (x >= 0 && x <= PLOT_WIDTH) {
        labels.push({ hour: real, x, key: h });
      }
    }

    return { stepPath: step, xLabels: labels };
  }, [effectiveTime, totalUrip]);

  const nowY = energyToY(currentEnergy);

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#E5E7EB" : "#1F2937" }]}>
          24h Energy Flow
        </Text>
        <View
          style={[
            styles.nowBadge,
            { backgroundColor: getEnergyColor(currentEnergy) },
          ]}
        >
          <Text style={styles.nowBadgeText}>
            {isToday
              ? `${timeStr} · ${getEnergyLabel(currentEnergy)}`
              : "Full Day Overview"}
          </Text>
        </View>
      </View>

      {/* Chart canvas with Y-axis labels */}
      <View style={styles.chartRow}>
        {/* Canvas */}
        <Canvas style={{ width: PLOT_WIDTH, height: CANVAS_HEIGHT }}>
          {/* Horizontal grid lines */}
          {Y_TICKS.map((tick) => (
            <SkiaLine
              key={tick}
              p1={vec(0, energyToY(tick))}
              p2={vec(PLOT_WIDTH, energyToY(tick))}
              color={gridColor}
              strokeWidth={GRID_LINE_WIDTH}
            />
          ))}

          {/* Step line with vertical gradient (green→blue→red matching web) */}
          <Path path={stepPath} style="stroke" strokeWidth={STEP_LINE_WIDTH}>
            <LinearGradient
              start={vec(0, energyToY(ENERGY_HIGH))}
              end={vec(0, energyToY(0))}
              colors={[
                COLOR_EMERALD,
                COLOR_EMERALD,
                COLOR_SKY,
                COLOR_SKY,
                COLOR_ROSE,
                COLOR_ROSE,
              ]}
              positions={[
                0,
                GRADIENT_STOP_1,
                GRADIENT_STOP_2,
                0.5,
                GRADIENT_STOP_3,
                1,
              ]}
            />
          </Path>

          {/* Dashed now-line — always centered (today only) */}
          {isToday && (
            <SkiaLine
              p1={vec(CENTER_X, CHART_TOP_PAD)}
              p2={vec(CENTER_X, CHART_TOP_PAD + PLOT_HEIGHT)}
              color={getEnergyColor(currentEnergy)}
              strokeWidth={DASH_LINE_WIDTH}
            >
              <DashPathEffect intervals={[DASH_ON, DASH_OFF]} />
            </SkiaLine>
          )}

          {/* Pulsing glow ring (today only) */}
          {isToday && (
            <Circle
              cx={CENTER_X}
              cy={nowY}
              r={glowR}
              color={getEnergyColor(currentEnergy)}
              opacity={glowOp}
            />
          )}

          {/* Dot — outer ring (today only) */}
          {isToday && (
            <Circle
              cx={CENTER_X}
              cy={nowY}
              r={DOT_RADIUS + DOT_BORDER}
              color={isDark ? "#0F172A" : "#FFFFFF"}
            />
          )}
          {/* Dot — inner (today only) */}
          {isToday && (
            <Circle
              cx={CENTER_X}
              cy={nowY}
              r={DOT_RADIUS}
              color={getEnergyColor(currentEnergy)}
            />
          )}
        </Canvas>

        {/* Y-axis labels on the right */}
        <View style={styles.yAxis}>
          {Y_TICKS.slice()
            .reverse()
            .map((tick) => (
              <Text
                key={tick}
                style={[
                  styles.yLabel,
                  {
                    color: tick > 0 ? getEnergyColor(tick) : textMutedColor,
                    top: energyToY(tick) - 6,
                  },
                ]}
              >
                {tick}%
              </Text>
            ))}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={[styles.xAxis, { width: PLOT_WIDTH }]}>
        {xLabels.map(({ hour, x, key }) => (
          <Text
            key={key}
            style={[styles.xLabel, { color: textMutedColor, left: x - 8 }]}
          >
            {String(hour).padStart(2, "0")}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: COLOR_EMERALD }]}
          />
          <Text style={[styles.legendText, { color: textMutedColor }]}>
            Good (100%)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_SKY }]} />
          <Text style={[styles.legendText, { color: textMutedColor }]}>
            Neutral (66%)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_ROSE }]} />
          <Text style={[styles.legendText, { color: textMutedColor }]}>
            Caution (33%)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "700" },
  nowBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  nowBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  chartRow: { flexDirection: "row" },
  yAxis: { width: Y_AXIS_WIDTH, position: "relative" },
  yLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "500",
    left: 4,
    fontFamily: "monospace",
  },
  xAxis: { flexDirection: "row", position: "relative", height: X_AXIS_HEIGHT },
  xLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: "500" },
});
