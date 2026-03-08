import { Dimensions, StyleSheet } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_H_MARGIN = 16;
const CARD_PEEK = 24;
export const SLIDE_WIDTH = SCREEN_WIDTH - CARD_H_MARGIN * 2 - CARD_PEEK;
export const SLIDE_GAP = 10;
const DOT_SIZE = 6;

export const SLIDE_SNAP = SLIDE_WIDTH + SLIDE_GAP;

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  gradient: {
    flex: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  slideCounter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  slideCounterText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.6)",
  },
  slideContainer: { flex: 1 },
  slideScroll: { paddingHorizontal: CARD_H_MARGIN },
  slideCard: {
    borderRadius: 16,
    padding: 16,
    marginRight: SLIDE_GAP,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  oracleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  oracleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  oracleIconEmoji: { fontSize: 20 },
  oracleHeaderText: { flex: 1 },
  oracleTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  oracleDate: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
    color: "rgba(255,255,255,0.7)",
  },
  divider: {
    height: 1,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 10,
    color: "rgba(255,255,255,0.7)",
  },
  oracleTextScroll: { flex: 1 },
  oracleText: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 20,
    color: "rgba(255,255,255,0.9)",
  },
  oracleEmptyIcon: { fontSize: 32, marginBottom: 8 },
  oracleEmptyText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dotActive: {
    width: 20,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  noInterestsHint: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    paddingBottom: 12,
    color: "rgba(255,255,255,0.6)",
  },
});
