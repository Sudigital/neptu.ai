import { address } from "@solana/kit";
import type { SolanaRpc } from "../client";
import { getAddresses, neptuToRaw, rawToNeptu } from "../constants";
import type { NetworkType } from "@neptu/shared";

export interface TokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: bigint;
  decimals: number;
}

export interface TokenBalance {
  raw: bigint;
  formatted: number;
}

interface ParsedTokenAccountData {
  parsed: {
    info: {
      tokenAmount: {
        amount: string;
        decimals: number;
        uiAmount: number;
      };
    };
  };
}

export async function getTokenBalance(
  rpc: SolanaRpc,
  ownerAddress: string,
  network: NetworkType,
): Promise<TokenBalance> {
  const addresses = getAddresses(network);
  if (!addresses.tokenMint) {
    return { raw: BigInt(0), formatted: 0 };
  }

  try {
    const result = await rpc
      .getTokenAccountsByOwner(
        address(ownerAddress),
        { mint: address(addresses.tokenMint) },
        { encoding: "jsonParsed" },
      )
      .send();

    if (result.value.length === 0) {
      return { raw: BigInt(0), formatted: 0 };
    }

    const account = result.value[0];
    const parsed = account.account.data as unknown as ParsedTokenAccountData;

    const raw = BigInt(parsed.parsed.info.tokenAmount.amount);
    return {
      raw,
      formatted: rawToNeptu(raw),
    };
  } catch {
    return { raw: BigInt(0), formatted: 0 };
  }
}

export async function getAssociatedTokenAddress(
  rpc: SolanaRpc,
  ownerAddress: string,
  network: NetworkType,
): Promise<string | null> {
  const addresses = getAddresses(network);
  if (!addresses.tokenMint) {
    return null;
  }

  try {
    const result = await rpc
      .getTokenAccountsByOwner(
        address(ownerAddress),
        { mint: address(addresses.tokenMint) },
        { encoding: "jsonParsed" },
      )
      .send();

    if (result.value.length === 0) {
      return null;
    }

    return result.value[0].pubkey;
  } catch {
    return null;
  }
}

export { neptuToRaw, rawToNeptu };
