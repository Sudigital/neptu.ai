import { PrivyProvider, usePrivy, useLoginWithOAuth } from "@privy-io/expo";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";

import type { CryptoData, AgentStats } from "./types";

import { AgentStatsCard } from "./components/AgentStatsCard";
import { CryptoCard } from "./components/CryptoCard";
import { styles } from "./styles";

const PRIVY_APP_ID = Constants.expoConfig?.extra?.privyAppId || "";
const WORKER_URL = "https://worker.neptu.sudigital.com";

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
    } catch {
      // Error handled silently - data fetch is non-critical
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
        {agentStats && <AgentStatsCard stats={agentStats} />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Crypto Birthdays</Text>
          {(() => {
            if (loading) {
              return (
                <ActivityIndicator
                  size="small"
                  color="#7C3AED"
                  style={{ marginTop: 20 }}
                />
              );
            }
            if (cryptos.length > 0) {
              return cryptos.map((crypto) => (
                <CryptoCard key={crypto.symbol} crypto={crypto} />
              ));
            }
            return (
              <Text style={styles.emptyText}>No crypto data available</Text>
            );
          })()}
        </View>

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
