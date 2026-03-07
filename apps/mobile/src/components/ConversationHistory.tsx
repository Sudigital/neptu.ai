import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import type { ConversationEntry } from "../types";

import { COLORS } from "../constants";

interface ConversationHistoryProps {
  history: ConversationEntry[];
  visible: boolean;
  onClose: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return time;

  const month = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${month} ${time}`;
}

function ConversationItem({ item }: { item: ConversationEntry }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
      <View style={styles.userBubble}>
        <Text style={styles.userLabel}>You</Text>
        <Text style={styles.userText}>{item.transcript}</Text>
      </View>
      <View style={styles.neptuBubble}>
        <Text style={styles.neptuLabel}>Neptu</Text>
        <Text style={styles.neptuText}>{item.response}</Text>
      </View>
    </View>
  );
}

export function ConversationHistory({
  history,
  visible,
  onClose,
}: ConversationHistoryProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(200)}
      style={styles.overlay}
    >
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>Conversations</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No conversations yet.{"\n"}Tap the mic to speak with Neptu.
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ConversationItem item={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Animated.View>
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
    backgroundColor: COLORS.background,
  },
  panel: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  list: {
    padding: 16,
    gap: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  item: {
    gap: 8,
  },
  itemHeader: {
    alignItems: "center",
    marginBottom: 4,
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  userBubble: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderTopRightRadius: 4,
    padding: 12,
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  userLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  userText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  neptuBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 12,
    alignSelf: "flex-start",
    maxWidth: "85%",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  neptuLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  neptuText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
