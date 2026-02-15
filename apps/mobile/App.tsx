import { PrivyProvider, usePrivy, useLoginWithOAuth } from "@privy-io/expo";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";

const PRIVY_APP_ID = Constants.expoConfig?.extra?.privyAppId || "";
const WORKER_URL = "https://worker.neptu.sudigital.com";

interface CryptoData {
  symbol: string;
  name: string;
  birthday: string;
  image?: string;
  currentPrice?: number;
  marketCap?: number;
  marketCapRank?: number;
  priceChangePercentage24h?: number;
  cosmicAlignment?: {
    alignmentScore: number;
    wuku: string;
    pancaWara: string;
    saptaWara: string;
  };
}

interface AgentStats {
  agent: {
    displayName: string;
    rank: number;
  };
  project: {
    totalVotes: number;
    humanVotes: number;
    agentVotes: number;
  };
}

function formatCurrency(value: number | undefined): string {
  if (!value) return "-";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000)
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(value < 1 ? 6 : 2)}`;
}

function isBirthdayToday(birthday: string): boolean {
  const now = new Date();
  const birthDate = new Date(birthday);
  return (
    now.getMonth() === birthDate.getMonth() &&
    now.getDate() === birthDate.getDate()
  );
}

function getAge(birthday: string): number {
  const now = new Date();
  const birthDate = new Date(birthday);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()))
    age--;
  return age;
}

function CryptoCard({ crypto }: { crypto: CryptoData }) {
  const isBirthday = isBirthdayToday(crypto.birthday);
  const isPriceUp = (crypto.priceChangePercentage24h ?? 0) >= 0;
  const age = getAge(crypto.birthday);

  return (
    <TouchableOpacity
      style={[styles.cryptoCard, isBirthday && styles.cryptoCardBirthday]}
      onPress={() =>
        Linking.openURL(
          `https://neptu.sudigital.com/cryptos/${crypto.symbol.toLowerCase()}`
        )
      }
    >
      <View style={styles.cryptoHeader}>
        {crypto.image ? (
          <Image source={{ uri: crypto.image }} style={styles.cryptoImage} />
        ) : (
          <View style={styles.cryptoImagePlaceholder}>
            <Text style={styles.cryptoImagePlaceholderText}>
              {crypto.symbol.slice(0, 2)}
            </Text>
          </View>
        )}
        <View style={styles.cryptoInfo}>
          <View style={styles.cryptoNameRow}>
            <Text style={styles.cryptoName}>{crypto.name}</Text>
            {isBirthday && <Text style={styles.birthdayBadge}>🎂</Text>}
          </View>
          <Text style={styles.cryptoSymbol}>
            {crypto.symbol} • {age}y old
          </Text>
        </View>
        <View style={styles.cryptoPriceContainer}>
          <Text style={styles.cryptoPrice}>
            {formatCurrency(crypto.currentPrice)}
          </Text>
          <Text
            style={[
              styles.cryptoChange,
              isPriceUp ? styles.priceUp : styles.priceDown,
            ]}
          >
            {isPriceUp ? "+" : ""}
            {crypto.priceChangePercentage24h?.toFixed(2)}%
          </Text>
        </View>
      </View>
      {crypto.cosmicAlignment && (
        <View style={styles.cosmicRow}>
          <Text style={styles.cosmicLabel}>Cosmic Score</Text>
          <View style={styles.cosmicScore}>
            <Text style={styles.cosmicScoreText}>
              {crypto.cosmicAlignment.alignmentScore}%
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function AgentStatsCard({ stats }: { stats: AgentStats }) {
  return (
    <TouchableOpacity
      style={styles.agentCard}
      onPress={() =>
        Linking.openURL("https://colosseum.com/agent-hackathon/projects/neptu")
      }
    >
      <View style={styles.agentHeader}>
        <Text style={styles.agentIcon}>🤖</Text>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{stats.agent.displayName}</Text>
          <Text style={styles.agentRank}>Agent Rank #{stats.agent.rank}</Text>
        </View>
        <View style={styles.agentVotes}>
          <Text style={styles.agentVotesNumber}>
            {stats.project.totalVotes}
          </Text>
          <Text style={styles.agentVotesLabel}>votes</Text>
        </View>
      </View>
      <View style={styles.agentVotesRow}>
        <View style={styles.voteItem}>
          <Text style={styles.voteNumber}>{stats.project.humanVotes}</Text>
          <Text style={styles.voteLabel}>Human</Text>
        </View>
        <View style={styles.voteItem}>
          <Text style={styles.voteNumber}>{stats.project.agentVotes}</Text>
          <Text style={styles.voteLabel}>Agent</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HomeScreen() {
  const { isReady, user, logout } = usePrivy();
  const { login } = useLoginWithOAuth();
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [cryptoRes, statsRes] = await Promise.all([
        fetch(`${WORKER_URL}/api/crypto/market`),
        fetch(`${WORKER_URL}/api/colosseum/agent-stats`),
      ]);

      if (cryptoRes.ok) {
        const cryptoJson = await cryptoRes.json();
        setCryptos(cryptoJson.data || []);
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setAgentStats(statsJson);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Neptu</Text>
          <Text style={styles.subtitle}>Crypto Cosmic Birthdays</Text>
        </View>
        {user ? (
          <TouchableOpacity style={styles.profileButton} onPress={logout}>
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => login({ provider: "google" })}
          >
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7C3AED"
          />
        }
      >
        {/* Agent Stats */}
        {agentStats && <AgentStatsCard stats={agentStats} />}

        {/* Crypto List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Crypto Birthdays</Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#7C3AED"
              style={{ marginTop: 20 }}
            />
          ) : cryptos.length > 0 ? (
            cryptos.map((crypto) => (
              <CryptoCard key={crypto.symbol} crypto={crypto} />
            ))
          ) : (
            <Text style={styles.emptyText}>No crypto data available</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Market data from CoinGecko • Cosmic insights by Neptu
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://neptu.sudigital.com")}
          >
            <Text style={styles.footerLink}>Open Web App →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID}>
      <HomeScreen />
    </PrivyProvider>
  );
}

const styles = StyleSheet.create({
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
