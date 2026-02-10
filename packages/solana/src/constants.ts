import { NEPTU_TOKEN, SOLANA_NETWORKS, type NetworkType } from "@neptu/shared";

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const TOKEN_DECIMALS_MULTIPLIER = Math.pow(10, NEPTU_TOKEN.DECIMALS);

export interface NeptuAddresses {
  tokenMint: string;
  treasury: string;
  rewardsPool: string;
}

// Token program ID (same across all networks)
const _TOKEN_PROGRAM_ID = "7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW";

// Mint PDA derived from ["mint"] + token program ID
// This is deterministic and the same across all networks
const MINT_PDA = "J4rUwfHS74XKTcNAX5wh5vuwYH4Fv5MR4Pdo4Gt4dhrq";

// Economy authority PDA derived from ["economy"] + economy program ID
const ECONOMY_AUTHORITY_PDA = "BRW7fxvTcnnzi6dvgfiCoTnWJRFSMCirKAGRVn41Co4E";

// Get env safely (works in both Node/Bun and Cloudflare Workers)
const getEnv = (key: string): string => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || "";
  }
  return "";
};

export const DEVNET_ADDRESSES: NeptuAddresses = {
  tokenMint: getEnv("NEPTU_TOKEN_MINT") || MINT_PDA,
  treasury: getEnv("NEPTU_TREASURY") || ECONOMY_AUTHORITY_PDA,
  rewardsPool: getEnv("NEPTU_REWARDS_POOL") || ECONOMY_AUTHORITY_PDA,
} as const;

export const MAINNET_ADDRESSES: NeptuAddresses = {
  tokenMint: MINT_PDA,
  treasury: ECONOMY_AUTHORITY_PDA,
  rewardsPool: ECONOMY_AUTHORITY_PDA,
} as const;

export function getAddresses(network: NetworkType): NeptuAddresses {
  switch (network) {
    case "devnet":
      return DEVNET_ADDRESSES;
    case "mainnet":
      return MAINNET_ADDRESSES;
    default:
      return DEVNET_ADDRESSES;
  }
}

export function getRpcUrl(network: NetworkType): string {
  return SOLANA_NETWORKS[network].rpcUrl;
}

export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * LAMPORTS_PER_SOL));
}

export function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export function neptuToRaw(neptu: number): bigint {
  return BigInt(Math.round(neptu * TOKEN_DECIMALS_MULTIPLIER));
}

export function rawToNeptu(raw: bigint): number {
  return Number(raw) / TOKEN_DECIMALS_MULTIPLIER;
}
