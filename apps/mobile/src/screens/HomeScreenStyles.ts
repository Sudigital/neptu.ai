import { StyleSheet } from "react-native";

const CARD_HORIZONTAL_MARGIN = 16;
const CHART_PADDING_H = 16;
const ICON_SIZE = 48;
const ICON_RADIUS = ICON_SIZE / 2;
const INSIGHT_CARD_H_MARGIN = CARD_HORIZONTAL_MARGIN;
const INSIGHT_DOT_SIZE = 6;
const INSIGHT_CARD_HEIGHT = 420;

export const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  heroSection: { marginBottom: 16 },
  heroScroll: { paddingHorizontal: CARD_HORIZONTAL_MARGIN },
  heroCardWrapper: { marginBottom: 8 },
  heroCard: { borderRadius: 20, padding: 16, zIndex: 2 },
  stackLayer: {
    position: "absolute",
    left: 2,
    right: 2,
    top: 4,
    bottom: -4,
    borderRadius: 20,
    zIndex: 1,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  heroTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroBadgeText: { fontSize: 11, fontWeight: "500", color: "#FFF" },
  heroIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconText: { fontSize: 22 },
  heroScore: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 12,
  },
  heroInsight: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 10,
    minHeight: 56,
  },
  heroInsightText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
  },
  heroTapHint: { alignItems: "center", marginTop: 8 },
  heroTapHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.3,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: CHART_PADDING_H,
  },
  insightScroll: { paddingHorizontal: INSIGHT_CARD_H_MARGIN },
  insightSlide: { height: INSIGHT_CARD_HEIGHT },
  insightDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 16,
  },
  insightDot: {
    width: INSIGHT_DOT_SIZE,
    height: INSIGHT_DOT_SIZE,
    borderRadius: INSIGHT_DOT_SIZE / 2,
  },
  insightLine: {
    width: 20,
    height: INSIGHT_DOT_SIZE,
    borderRadius: INSIGHT_DOT_SIZE / 2,
  },
});
