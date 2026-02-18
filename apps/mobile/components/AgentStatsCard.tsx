import { Text, View, TouchableOpacity, Linking } from "react-native";

import type { AgentStats } from "../types";

import { styles } from "../styles";

export function AgentStatsCard({ stats }: { stats: AgentStats }) {
  return (
    <TouchableOpacity
      style={styles.agentCard}
      onPress={() => Linking.openURL("https://neptu.sudigital.com")}
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
