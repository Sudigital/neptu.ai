// ============================================================================
// Blockchain Types
// ============================================================================

export type ChainType = "solana" | "evm";
export type NetworkType = "localnet" | "devnet" | "mainnet";

export interface ChainNetwork {
  name: string;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl: string;
  chainId?: number;
}

export interface ChainConfig {
  type: ChainType;
  networks: Record<NetworkType, ChainNetwork>;
  defaultNetwork: NetworkType;
}

// ============================================================================
// Solana Network Configuration
// ============================================================================

export const SOLANA_NETWORKS: Record<NetworkType, ChainNetwork> = {
  localnet: {
    name: "Localnet",
    rpcUrl: "http://localhost:8899",
    wsUrl: "ws://localhost:8900",
    explorerUrl: "http://localhost:3000",
  },
  devnet: {
    name: "Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    wsUrl: "wss://api.devnet.solana.com",
    explorerUrl: "https://solscan.io?cluster=devnet",
  },
  mainnet: {
    name: "Mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    wsUrl: "wss://api.mainnet-beta.solana.com",
    explorerUrl: "https://solscan.io",
  },
} as const;

// ============================================================================
// EVM Network Configuration (Base L2)
// ============================================================================

export const EVM_NETWORKS: Record<NetworkType, ChainNetwork> = {
  localnet: {
    name: "Hardhat",
    rpcUrl: "http://localhost:8545",
    explorerUrl: "http://localhost:3000",
    chainId: 31337,
  },
  devnet: {
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    chainId: 84532,
  },
  mainnet: {
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    chainId: 8453,
  },
} as const;

// ============================================================================
// Chain Configuration
// ============================================================================

export const CHAIN_CONFIGS: Record<ChainType, ChainConfig> = {
  solana: {
    type: "solana",
    networks: SOLANA_NETWORKS,
    defaultNetwork: "devnet",
  },
  evm: {
    type: "evm",
    networks: EVM_NETWORKS,
    defaultNetwork: "devnet",
  },
} as const;

export const DEFAULT_CHAIN: ChainType = "solana";
export const DEFAULT_NETWORK: NetworkType = "devnet";

export function getNetworkConfig(
  chain: ChainType = DEFAULT_CHAIN,
  network: NetworkType = DEFAULT_NETWORK
): ChainNetwork {
  return CHAIN_CONFIGS[chain].networks[network];
}
