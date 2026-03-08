import { Dimensions, StyleSheet } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_H_MARGIN = 12;
export const SLIDE_WIDTH = SCREEN_WIDTH - CARD_H_MARGIN * 2;
export const SLIDE_GAP = 8;
const DOT_SIZE = 6;

export const SLIDE_SNAP = SLIDE_WIDTH + SLIDE_GAP;

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 8,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10,
  },
  sheet: {
    borderRadius: 36,
    maxHeight: "90%",
    paddingBottom: 30,
    borderTopWidth: 8,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  cancelText: { fontSize: 15, fontWeight: "500" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  slideCounter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  slideCounterText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  slideContainer: { flex: 1 },
  slideScroll: { paddingHorizontal: CARD_H_MARGIN },
  slideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginRight: SLIDE_GAP,
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
  },
  oracleIconEmoji: { fontSize: 20 },
  oracleHeaderText: { flex: 1 },
  oracleTitle: { fontSize: 14, fontWeight: "700" },
  oracleDate: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  divider: { height: 1, marginBottom: 12 },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: { fontSize: 13, fontWeight: "500", marginTop: 10 },
  oracleTextScroll: { flex: 1 },
  oracleText: { fontSize: 13, fontWeight: "400", lineHeight: 20 },
  oracleEmptyIcon: { fontSize: 32, marginBottom: 8 },
  oracleEmptyText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dotActive: { width: 20, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  dotInactive: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  noInterestsHint: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    paddingBottom: 12,
  },
});
