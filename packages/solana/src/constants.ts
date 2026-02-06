import { NEPTU_TOKEN, SOLANA_NETWORKS, type NetworkType } from "@neptu/shared";

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const TOKEN_DECIMALS_MULTIPLIER = Math.pow(10, NEPTU_TOKEN.DECIMALS);

export interface NeptuAddresses {
  tokenMint: string;
  treasury: string;
  rewardsPool: string;
}

// Get env safely (works in both Node/Bun and Cloudflare Workers)
const getEnv = (key: string): string => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || "";
  }
  return "";
};

export const DEVNET_ADDRESSES: NeptuAddresses = {
  tokenMint: getEnv("NEPTU_TOKEN_MINT"),
  treasury: getEnv("NEPTU_TREASURY"),
  rewardsPool: getEnv("NEPTU_REWARDS_POOL"),
} as const;

export const MAINNET_ADDRESSES: NeptuAddresses = {
  tokenMint: "",
  treasury: "",
  rewardsPool: "",
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
