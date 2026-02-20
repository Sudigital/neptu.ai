import { SUBSCRIPTION_PLANS } from "@neptu/shared";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

import type { WalletBalance, SubscriptionInfo } from "../types";

import { COLORS } from "../constants";
import { getWalletBalances, getSubscription } from "../services/voice-api";

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

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    Promise.all([
      getWalletBalances(walletAddress),
      getSubscription(walletAddress),
    ])
      .then(([bal, sub]) => {
        setBalance(bal);
        setSubscription(sub);
      })
      .finally(() => setLoading(false));
  }, [visible, walletAddress]);

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
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeText}>
                  Upgrade to Seeker ({SUBSCRIPTION_PLANS.WEEKLY.SOL} SOL)
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
  upgradeText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
