import { useState, useEffect } from "react";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

interface NeptuVotes {
  humanVotes: number;
  agentVotes: number;
  totalVotes: number;
  projectName: string;
  projectSlug: string;
  updatedAt: string;
}

interface UseNeptuVotesResult {
  votes: NeptuVotes | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNeptuVotes(): UseNeptuVotesResult {
  const [votes, setVotes] = useState<NeptuVotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${WORKER_URL}/api/colosseum/project-votes`);

      if (!response.ok) {
        throw new Error("Failed to fetch votes");
      }

      const data = await response.json();
      setVotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();

    // Refresh every 5 minutes
    const interval = setInterval(fetchVotes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    votes,
    loading,
    error,
    refetch: fetchVotes,
  };
}
