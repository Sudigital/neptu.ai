import { SUBSCRIPTION_PLANS } from "@neptu/shared";
import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  WalletBalance,
  SubscriptionInfo,
  StreakInfo,
  RewardInfo,
} from "../types";

import { ErrorBanner } from "../components/ErrorBanner";
import { usePayment } from "../hooks/usePayment";
import { useTheme } from "../hooks/useTheme";
import { signMessage } from "../services/solana-mobile";
import { getMwaAuthToken } from "../services/storage";
import {
  getWalletBalances,
  getSubscription,
  getStreakInfo,
  getPendingRewards,
  claimReward,
} from "../services/voice-api";

const PLAN_LABELS: Record<string, string> = {
  FREE: "Explorer",
  WEEKLY: "Seeker",
  MONTHLY: "Mystic",
  YEARLY: "Oracle",
};
const BALANCE_FRACTION_DIGITS = 4;
const REWARD_FRACTION_DIGITS = 2;
const SHORT_ADDR_PREFIX = 4;
const SHORT_ADDR_SUFFIX = 4;
const FREE_CONVERSATION_LIMIT = 5;

interface WalletScreenProps {
  walletAddress: string;
}

export function WalletScreen({ walletAddress }: WalletScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const payment = usePayment();

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [rewardsList, setRewardsList] = useState<RewardInfo[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setLoading(true);
    Promise.all([
      getWalletBalances(walletAddress),
      getSubscription(walletAddress),
      getStreakInfo(walletAddress).catch(() => ({
        success: false,
        streak: null,
        hasCheckedInToday: false,
      })),
      getPendingRewards(walletAddress).catch(() => ({
        success: false,
        rewards: [],
        totalPending: 0,
      })),
    ])
      .then(([bal, sub, streakRes, rewardsRes]) => {
        setApiError(null);
        setBalance(bal);
        setSubscription(sub);
        setStreak(streakRes.streak);
        setPendingRewards(rewardsRes.totalPending);
        setRewardsList(rewardsRes.rewards ?? []);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load wallet data";
        setApiError(msg);
      })
      .finally(() => setLoading(false));
  }, [walletAddress]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleClaimAll = async () => {
    if (rewardsList.length === 0) return;
    setIsClaiming(true);
    try {
      const authToken = getMwaAuthToken();
      const claimMessage = `Neptu: claim ${rewardsList.length} rewards at ${Date.now()}`;
      const signature = await signMessage(claimMessage, authToken);
      for (const reward of rewardsList) {
        await claimReward(walletAddress, reward.id, signature);
      }
      Alert.alert(
        "Rewards Claimed!",
        `${pendingRewards.toFixed(REWARD_FRACTION_DIGITS)} tokens claimed.`
      );
      refreshData();
    } catch {
      Alert.alert("Claim Failed", "Could not claim rewards. Try again later.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleUpgrade = async () => {
    const success = await payment.pay(walletAddress, "WEEKLY", "sol");
    if (success) {
      Alert.alert("Upgraded!", "You are now a Seeker. Enjoy your readings!");
      refreshData();
    } else if (payment.error) {
      Alert.alert("Payment Failed", payment.error);
    }
  };

  const shortAddress = `${walletAddress.slice(0, SHORT_ADDR_PREFIX)}...${walletAddress.slice(-SHORT_ADDR_SUFFIX)}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.headerSection}
        >
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            Wallet
          </Text>
          <Text style={[styles.address, { color: colors.textMuted }]}>
            {shortAddress}
          </Text>
        </Animated.View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* Balance card */}
            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? "#1A1040" : "#EDE9FE",
                    borderColor: isDark ? "#7C3AED40" : "#C4B5FD",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#DDD6FE" : "#5B21B6" },
                  ]}
                >
                  Balances
                </Text>
                <BalanceRow
                  label="SOL"
                  value={balance?.sol?.formatted ?? 0}
                  colors={colors}
                />
                <BalanceRow
                  label="NEPTU"
                  value={balance?.neptu?.formatted ?? 0}
                  colors={colors}
                />
                <BalanceRow
                  label="SUDIGITAL"
                  value={balance?.sudigital?.formatted ?? 0}
                  colors={colors}
                />
              </View>
            </Animated.View>

            {/* Streak & Rewards */}
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: `${colors.textMuted}15`,
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Streak & Rewards
                </Text>
                <View style={styles.statRow}>
                  <Text style={[styles.statEmoji]}>🔥</Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Current Streak
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {streak?.currentStreak ?? 0} days
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statEmoji]}>🏆</Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Best Streak
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {streak?.longestStreak ?? 0} days
                  </Text>
                </View>
                {pendingRewards > 0 && (
                  <>
                    <View style={styles.statRow}>
                      <Text style={[styles.statEmoji]}>🎁</Text>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Pending
                      </Text>
                      <Text
                        style={[styles.statValue, { color: colors.success }]}
                      >
                        {pendingRewards.toFixed(REWARD_FRACTION_DIGITS)} NEPTU
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.claimButton,
                        {
                          backgroundColor: colors.success,
                          opacity: isClaiming ? 0.6 : 1,
                        },
                      ]}
                      onPress={handleClaimAll}
                      disabled={isClaiming}
                    >
                      <Text style={[styles.claimText]}>
                        {isClaiming ? "Claiming..." : "Claim All Rewards"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Animated.View>

            {/* Subscription */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: `${colors.textMuted}15`,
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Subscription
                </Text>
                <View style={styles.statRow}>
                  <Text style={[styles.statEmoji]}>📖</Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Plan
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {PLAN_LABELS[subscription?.plan ?? "FREE"]}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statEmoji]}>💬</Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Today&apos;s Chats
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {subscription?.freeConversationsUsed ?? 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statEmoji]}>🎟️</Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Free Left
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {(subscription?.freeConversationsLimit ??
                      FREE_CONVERSATION_LIMIT) -
                      (subscription?.freeConversationsUsed ?? 0)}
                  </Text>
                </View>

                {subscription?.plan === "FREE" && (
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: payment.isPaying ? 0.6 : 1,
                      },
                    ]}
                    onPress={handleUpgrade}
                    disabled={payment.isPaying}
                  >
                    <Text style={styles.upgradeText}>
                      {payment.isPaying
                        ? "Processing..."
                        : `Upgrade to Seeker (${SUBSCRIPTION_PLANS.WEEKLY.SOL} SOL)`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

interface BalanceRowProps {
  label: string;
  value: number;
  colors: { text: string; textSecondary: string };
}

function BalanceRow({ label, value, colors }: BalanceRowProps) {
  return (
    <View style={styles.balanceRow}>
      <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.balanceValue, { color: colors.text }]}>
        {value.toLocaleString(undefined, {
          maximumFractionDigits: BALANCE_FRACTION_DIGITS,
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  headerSection: { paddingHorizontal: 20, marginBottom: 16 },
  screenTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 0.3 },
  address: { fontSize: 13, fontFamily: "monospace", marginTop: 4 },
  loader: { marginTop: 60 },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  balanceLabel: { fontSize: 14, fontWeight: "500" },
  balanceValue: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  statEmoji: { fontSize: 16, width: 24 },
  statLabel: { flex: 1, fontSize: 13, fontWeight: "500" },
  statValue: { fontSize: 14, fontWeight: "700" },
  claimButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  claimText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  upgradeButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  upgradeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
