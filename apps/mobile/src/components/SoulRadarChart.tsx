import {
  Canvas,
  Path as SkiaPath,
  Skia,
  Circle as SkiaCircle,
  Line as SkiaLine,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const RADAR_SIZE = 220;
const RADAR_INNER_RADIUS = 80;
const RADAR_LEVELS = 4;
const RADAR_DOT_R = 4;
const DIMENSION_COUNT = 5;
const PELUANG_FILL_OPACITY = 0.25;
const POTENSI_FILL_OPACITY = 0.2;
const RADAR_LABEL_OFFSET_R = 22;
const RADAR_LABEL_HALF_W = 35;
const STROKE_WIDTH_POLY = 2;
const CARD_PADDING = 16;

const COLOR_SKY = "#0EA5E9";
const COLOR_AMBER = "#F59E0B";
const COLOR_GREEN = "#22C55E";
const COLOR_RED = "#EF4444";

import {
  DIM_KEYS,
  DIMENSION_LABELS_ORDERED as DIMENSION_LABELS,
  DIMENSION_EMOJIS_ORDERED as DIMENSION_EMOJIS,
} from "../constants/aura";

interface DimValue {
  value: number;
  name: string;
}

interface SoulDimensions {
  cipta: DimValue;
  rasa: DimValue;
  karsa: DimValue;
  tindakan: DimValue;
  frekuensi: DimValue;
  dualitas: string;
  afirmasi: string;
}

interface ThemeColors {
  text: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
}

interface SoulRadarChartProps {
  peluangLabel: string;
  peluang: SoulDimensions;
  potensi: SoulDimensions | null;
  colors: ThemeColors;
  isDark: boolean;
}

function getArrow(diff: number): string {
  if (diff > 0) return "↑";
  if (diff < 0) return "↓";
  return "";
}

function dimAngle(i: number): number {
  return (i / DIMENSION_COUNT) * Math.PI * 2 - Math.PI / 2;
}

export function SoulRadarChart({
  peluangLabel,
  peluang,
  potensi,
  colors,
  isDark,
}: SoulRadarChartProps) {
  // Auto-scale: find the max value across all dimensions (matching web's Recharts behavior)
  const autoMax = useMemo(() => {
    let mx = 1;
    for (const k of DIM_KEYS) {
      mx = Math.max(mx, peluang[k].value);
      if (potensi) mx = Math.max(mx, potensi[k].value);
    }
    return mx;
  }, [peluang, potensi]);

  const radarPeluang = useMemo(
    () => DIM_KEYS.map((k) => ({ value: peluang[k].value, max: autoMax })),
    [peluang, autoMax]
  );

  const radarPotensi = useMemo(() => {
    if (!potensi) return null;
    return DIM_KEYS.map((k) => ({ value: potensi[k].value, max: autoMax }));
  }, [potensi, autoMax]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.textMuted}15`,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>Dimensi Jiwa</Text>
        <Text
          style={[
            styles.dualitasText,
            { color: isDark ? "#A78BFA" : "#7C3AED" },
          ]}
        >
          {peluang.dualitas}
          {peluang.afirmasi ? ` · ${peluang.afirmasi}` : ""}
        </Text>
      </View>

      {/* Skia radar chart with filled polygons */}
      <View style={styles.radarContainer}>
        <Canvas style={{ width: RADAR_SIZE, height: RADAR_SIZE }}>
          {/* Grid rings (dashed pentagons) */}
          {Array.from({ length: RADAR_LEVELS }, (_, lvl) => {
            const r = ((lvl + 1) / RADAR_LEVELS) * RADAR_INNER_RADIUS;
            const gridPath = Skia.Path.Make();
            for (let i = 0; i <= DIMENSION_COUNT; i++) {
              const angle = dimAngle(i);
              const gx = RADAR_SIZE / 2 + Math.cos(angle) * r;
              const gy = RADAR_SIZE / 2 + Math.sin(angle) * r;
              if (i === 0) gridPath.moveTo(gx, gy);
              else gridPath.lineTo(gx, gy);
            }
            gridPath.close();
            return (
              <SkiaPath
                key={`grid-${lvl}`}
                path={gridPath}
                style="stroke"
                strokeWidth={1}
                color={`${colors.textMuted}30`}
              />
            );
          })}

          {/* Axis lines from center to each vertex */}
          {Array.from({ length: DIMENSION_COUNT }, (_, i) => {
            const angle = dimAngle(i);
            const ex = RADAR_SIZE / 2 + Math.cos(angle) * RADAR_INNER_RADIUS;
            const ey = RADAR_SIZE / 2 + Math.sin(angle) * RADAR_INNER_RADIUS;
            return (
              <SkiaLine
                key={`axis-${i}`}
                p1={vec(RADAR_SIZE / 2, RADAR_SIZE / 2)}
                p2={vec(ex, ey)}
                color={`${colors.textMuted}20`}
                strokeWidth={1}
              />
            );
          })}

          {/* Potensi (birth) — amber filled polygon */}
          {radarPotensi &&
            (() => {
              const polyPath = Skia.Path.Make();
              radarPotensi.forEach((dim, i) => {
                const norm = dim.value / dim.max;
                const r = RADAR_INNER_RADIUS * Math.min(norm, 1);
                const angle = dimAngle(i);
                const px = RADAR_SIZE / 2 + Math.cos(angle) * r;
                const py = RADAR_SIZE / 2 + Math.sin(angle) * r;
                if (i === 0) polyPath.moveTo(px, py);
                else polyPath.lineTo(px, py);
              });
              polyPath.close();
              return (
                <>
                  <SkiaPath
                    path={polyPath}
                    style="fill"
                    color={COLOR_AMBER}
                    opacity={POTENSI_FILL_OPACITY}
                  />
                  <SkiaPath
                    path={polyPath}
                    style="stroke"
                    strokeWidth={STROKE_WIDTH_POLY}
                    color={COLOR_AMBER}
                  />
                </>
              );
            })()}

          {/* Peluang (selected day) — blue filled polygon */}
          {(() => {
            const polyPath = Skia.Path.Make();
            radarPeluang.forEach((dim, i) => {
              const norm = dim.value / dim.max;
              const r = RADAR_INNER_RADIUS * Math.min(norm, 1);
              const angle = dimAngle(i);
              const px = RADAR_SIZE / 2 + Math.cos(angle) * r;
              const py = RADAR_SIZE / 2 + Math.sin(angle) * r;
              if (i === 0) polyPath.moveTo(px, py);
              else polyPath.lineTo(px, py);
            });
            polyPath.close();
            return (
              <>
                <SkiaPath
                  path={polyPath}
                  style="fill"
                  color={COLOR_SKY}
                  opacity={PELUANG_FILL_OPACITY}
                />
                <SkiaPath
                  path={polyPath}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH_POLY}
                  color={COLOR_SKY}
                />
              </>
            );
          })()}

          {/* Peluang dots */}
          {radarPeluang.map((dim, i) => {
            const norm = dim.value / dim.max;
            const r = RADAR_INNER_RADIUS * Math.min(norm, 1);
            const angle = dimAngle(i);
            return (
              <SkiaCircle
                key={`pdot-${i}`}
                cx={RADAR_SIZE / 2 + Math.cos(angle) * r}
                cy={RADAR_SIZE / 2 + Math.sin(angle) * r}
                r={RADAR_DOT_R}
                color={COLOR_SKY}
              />
            );
          })}

          {/* Potensi dots */}
          {radarPotensi?.map((dim, i) => {
            const norm = dim.value / dim.max;
            const r = RADAR_INNER_RADIUS * Math.min(norm, 1);
            const angle = dimAngle(i);
            return (
              <SkiaCircle
                key={`tdot-${i}`}
                cx={RADAR_SIZE / 2 + Math.cos(angle) * r}
                cy={RADAR_SIZE / 2 + Math.sin(angle) * r}
                r={RADAR_DOT_R}
                color={COLOR_AMBER}
              />
            );
          })}
        </Canvas>

        {/* Labels positioned around the radar */}
        {DIMENSION_LABELS.map((label, i) => {
          const angle = dimAngle(i);
          const labelR = RADAR_INNER_RADIUS + RADAR_LABEL_OFFSET_R;
          const lx = RADAR_SIZE / 2 + Math.cos(angle) * labelR;
          const ly = RADAR_SIZE / 2 + Math.sin(angle) * labelR;
          return (
            <Text
              key={label}
              style={[
                styles.radarLabel,
                {
                  left: lx - RADAR_LABEL_HALF_W,
                  top: ly - 8,
                  color: colors.textSecondary,
                },
              ]}
            >
              {DIMENSION_EMOJIS[i]} {label}
            </Text>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.radarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_SKY }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>
            Peluang ({peluangLabel})
          </Text>
        </View>
        {potensi && (
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: COLOR_AMBER }]}
            />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>
              Potensi (Lahir)
            </Text>
          </View>
        )}
      </View>

      {/* Soul Profile — dimension values with arrows */}
      <View style={styles.profilGrid}>
        {DIM_KEYS.map((k, i) => {
          const pel = peluang[k];
          const pot = potensi?.[k];
          const diff = pot ? pel.value - pot.value : 0;
          const arrow = getArrow(diff);
          const arrowColor = diff > 0 ? COLOR_GREEN : COLOR_RED;
          return (
            <View key={k} style={styles.profilItem}>
              <Text style={styles.profilEmoji}>{DIMENSION_EMOJIS[i]}</Text>
              <Text
                style={[styles.profilLabel, { color: colors.textSecondary }]}
              >
                {DIMENSION_LABELS[i]}
              </Text>
              {arrow !== "" && (
                <Text style={[styles.profilArrow, { color: arrowColor }]}>
                  {arrow}
                </Text>
              )}
              <Text style={[styles.profilValue, { color: colors.text }]}>
                {pel.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: CARD_PADDING,
  },
  title: { fontSize: 16, fontWeight: "700" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dualitasText: { fontSize: 11, fontWeight: "700" },
  radarContainer: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignSelf: "center",
    marginBottom: 4,
  },
  radarLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "600",
    width: 70,
    textAlign: "center",
  },
  radarLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: "500" },
  profilGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    columnGap: 20,
  },
  profilItem: {
    width: "44%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  profilEmoji: { fontSize: 14, marginRight: 4 },
  profilLabel: { fontSize: 12, fontWeight: "500", flex: 1 },
  profilValue: { fontSize: 14, fontWeight: "700", marginRight: 2 },
  profilArrow: { fontSize: 12, fontWeight: "700" },
});
