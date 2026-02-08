import { useState, useEffect } from "react";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

export interface AgentStats {
  agent: {
    name: string;
    displayName: string;
    xUsername: string;
    rank: number;
  };
  stats: {
    posts: number;
    comments: number;
    mentions: number;
  };
  project: {
    name: string;
    slug: string;
    humanVotes: number;
    agentVotes: number;
    totalVotes: number;
  };
  projectUrl: string;
  updatedAt: string;
}

interface UseAgentStatsResult {
  stats: AgentStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgentStats(): UseAgentStatsResult {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${WORKER_URL}/api/colosseum/agent-stats`);

      if (!response.ok) {
        throw new Error("Failed to fetch agent stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}
