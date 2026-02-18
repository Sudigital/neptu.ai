export interface CryptoData {
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

export interface AgentStats {
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
