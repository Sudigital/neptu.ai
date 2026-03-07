import { SUBSCRIPTION_PLANS } from "@neptu/shared";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

import type {
  WalletBalance,
  SubscriptionInfo,
  StreakInfo,
  RewardInfo,
} from "../types";

import { COLORS, SOLANA_NETWORK } from "../constants";
import { usePayment } from "../hooks/usePayment";
import { signMessage } from "../services/solana-mobile";
import { getMwaAuthToken } from "../services/storage";
import {
  getWalletBalances,
  getSubscription,
  getStreakInfo,
  getPendingRewards,
  claimReward,
} from "../services/voice-api";

interface WalletPanelProps {
  walletAddress: string;
  visible: boolean;
  onClose: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "Explorer",
  WEEKLY: "Seeker",
  MONTHLY: "Mystic",
  YEARLY: "Oracle",
};

export function WalletPanel({
  walletAddress,
  visible,
  onClose,
}: WalletPanelProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [rewardsList, setRewardsList] = useState<RewardInfo[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const payment = usePayment();

  const refreshData = () => {
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
        setBalance(bal);
        setSubscription(sub);
        setStreak(streakRes.streak);
        setPendingRewards(rewardsRes.totalPending);
        setRewardsList(rewardsRes.rewards ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!visible) return;
    refreshData();
  }, [visible, walletAddress]);

  const handleClaimAll = async () => {
    if (rewardsList.length === 0) return;
    setIsClaiming(true);
    try {
      const authToken = getMwaAuthToken();
      // Sign a claim message via MWA as proof of wallet ownership
      const claimMessage = `Neptu: claim ${rewardsList.length} rewards at ${Date.now()}`;
      const signature = await signMessage(claimMessage, authToken);

      // Claim each reward with the signed message as proof
      for (const reward of rewardsList) {
        await claimReward(walletAddress, reward.id, signature);
      }
      Alert.alert(
        "Rewards Claimed!",
        `${pendingRewards.toFixed(2)} tokens claimed.`
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

  if (!visible) return null;

  const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutRight.duration(200)}
      style={styles.overlay}
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Wallet</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.address}>{shortAddress}</Text>

            <View style={styles.balanceSection}>
              <BalanceRow label="SOL" value={balance?.sol?.formatted ?? 0} />
              <BalanceRow
                label="NEPTU"
                value={balance?.neptu?.formatted ?? 0}
              />
              <BalanceRow
                label="SUDIGITAL"
                value={balance?.sudigital?.formatted ?? 0}
              />
            </View>

            <View style={styles.divider} />

            {/* Streak & Rewards */}
            <View style={styles.statsSection}>
              <Text style={styles.statLabel}>
                🔥 Streak:{" "}
                <Text style={styles.statValue}>
                  {streak?.currentStreak ?? 0} days
                </Text>
              </Text>
              <Text style={styles.statLabel}>
                🏆 Best:{" "}
                <Text style={styles.statValue}>
                  {streak?.longestStreak ?? 0} days
                </Text>
              </Text>
              {pendingRewards > 0 && (
                <View>
                  <Text style={styles.statLabel}>
                    🎁 Pending Rewards:{" "}
                    <Text style={[styles.statValue, { color: COLORS.success }]}>
                      {pendingRewards.toFixed(2)}{" "}
                      {SOLANA_NETWORK === "mainnet" ? "SKR" : "SUDIGITAL"}
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.claimButton,
                      isClaiming && styles.upgradeButtonDisabled,
                    ]}
                    onPress={handleClaimAll}
                    disabled={isClaiming}
                  >
                    <Text style={styles.claimText}>
                      {isClaiming ? "Claiming..." : "Claim Rewards"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.statsSection}>
              <Text style={styles.statLabel}>
                Today's Conversations:{" "}
                <Text style={styles.statValue}>
                  {subscription?.freeConversationsUsed ?? 0}
                </Text>
              </Text>
              <Text style={styles.statLabel}>
                Free Remaining:{" "}
                <Text style={styles.statValue}>
                  {(subscription?.freeConversationsLimit ?? 5) -
                    (subscription?.freeConversationsUsed ?? 0)}
                </Text>
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.planLabel}>
              Subscription:{" "}
              <Text style={styles.planValue}>
                {PLAN_LABELS[subscription?.plan ?? "FREE"]}
              </Text>
            </Text>

            {subscription?.plan === "FREE" && (
              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  payment.isPaying && styles.upgradeButtonDisabled,
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
          </>
        )}
      </View>
    </Animated.View>
  );
}

function BalanceRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.balanceRow}>
      <Text style={styles.balanceLabel}>{label}</Text>
      <Text style={styles.balanceValue}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    width: 300,
    backgroundColor: COLORS.surface,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  address: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: "monospace",
  },
  loader: {
    marginTop: 40,
  },
  balanceSection: {
    gap: 12,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  balanceValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
    marginVertical: 20,
  },
  statsSection: {
    gap: 8,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statValue: {
    color: COLORS.text,
    fontWeight: "600",
  },
  planLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  planValue: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  claimButton: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  claimText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
