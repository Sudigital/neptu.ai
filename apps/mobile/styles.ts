import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonText: {
    fontSize: 20,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
  },
  connectButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  agentCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#7C3AED33",
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  agentIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  agentRank: {
    fontSize: 13,
    color: "#FFD700",
    marginTop: 2,
  },
  agentVotes: {
    alignItems: "center",
    backgroundColor: "#7C3AED22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  agentVotesNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  agentVotesLabel: {
    fontSize: 11,
    color: "#888",
  },
  agentVotesRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  voteItem: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  voteNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  voteLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  cryptoCard: {
    backgroundColor: "#151515",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  cryptoCardBirthday: {
    borderColor: "#7C3AED",
    backgroundColor: "#1a1a2e",
  },
  cryptoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cryptoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cryptoImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  cryptoImagePlaceholderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  cryptoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cryptoNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cryptoName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  birthdayBadge: {
    fontSize: 14,
  },
  cryptoSymbol: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  cryptoPriceContainer: {
    alignItems: "flex-end",
  },
  cryptoPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  cryptoChange: {
    fontSize: 12,
    marginTop: 2,
  },
  priceUp: {
    color: "#22c55e",
  },
  priceDown: {
    color: "#ef4444",
  },
  cosmicRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  cosmicLabel: {
    fontSize: 12,
    color: "#888",
  },
  cosmicScore: {
    backgroundColor: "#7C3AED22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cosmicScoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  footerLink: {
    fontSize: 14,
    color: "#7C3AED",
    marginTop: 12,
    fontWeight: "500",
  },
});
