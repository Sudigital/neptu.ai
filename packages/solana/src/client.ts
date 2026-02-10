import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  signature as createSignature,
} from "@solana/kit";
import { SOLANA_NETWORKS, type NetworkType } from "@neptu/shared";

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;
export type SolanaRpcSubscriptions = ReturnType<
  typeof createSolanaRpcSubscriptions
>;

export interface SolanaClient {
  rpc: SolanaRpc;
  rpcSubscriptions?: SolanaRpcSubscriptions;
  network: NetworkType;
}

// Fallback devnet RPC endpoints for resilience against rate limiting
const DEVNET_RPC_FALLBACKS = ["https://api.devnet.solana.com"];

export function createSolanaClient(
  network: NetworkType,
  rpcUrl?: string,
): SolanaClient {
  const config = SOLANA_NETWORKS[network];
  const url = rpcUrl || config.rpcUrl;

  const rpc = createSolanaRpc(url);
  const rpcSubscriptions = config.wsUrl
    ? createSolanaRpcSubscriptions(config.wsUrl)
    : undefined;

  return {
    rpc,
    rpcSubscriptions,
    network,
  };
}

export async function getBalance(
  rpc: SolanaRpc,
  addressStr: string,
): Promise<bigint> {
  const result = await rpc.getBalance(address(addressStr)).send();
  return result.value;
}

/**
 * Fetch latest blockhash using raw fetch to avoid @solana/kit RPC issues
 * on Cloudflare Workers (403/429 from shared IP rate limiting).
 */
async function fetchBlockhashViaHttp(
  rpcUrl: string,
): Promise<{ blockhash: string; lastValidBlockHeight: bigint }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLatestBlockhash",
        params: [{ commitment: "confirmed" }],
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC HTTP error (${response.status})`);
    }

    const data = (await response.json()) as {
      result?: {
        value: { blockhash: string; lastValidBlockHeight: number };
      };
      error?: { message: string };
    };

    if (data.error || !data.result) {
      throw new Error(data.error?.message || "Failed to get latest blockhash");
    }

    return {
      blockhash: data.result.value.blockhash,
      lastValidBlockHeight: BigInt(data.result.value.lastValidBlockHeight),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get latest blockhash with automatic retry and RPC fallback.
 * Tries @solana/kit RPC first, falls back to raw fetch for CF Workers compatibility.
 */
export async function getLatestBlockhash(
  rpc: SolanaRpc,
  network: NetworkType = "devnet",
): Promise<{ blockhash: string; lastValidBlockHeight: bigint }> {
  // Try primary RPC via @solana/kit (with 5s timeout)
  try {
    const rpcPromise = rpc.getLatestBlockhash().send();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("RPC timeout")), 5000),
    );
    const result = await Promise.race([rpcPromise, timeoutPromise]);
    return {
      blockhash: result.value.blockhash,
      lastValidBlockHeight: result.value.lastValidBlockHeight,
    };
  } catch {
    // Primary failed — fall back to raw fetch for devnet
    if (network !== "devnet") throw new Error("RPC request failed");
  }

  // Try raw fetch fallbacks (avoids @solana/kit URL handling issues)
  for (const fallbackUrl of DEVNET_RPC_FALLBACKS) {
    try {
      return await fetchBlockhashViaHttp(fallbackUrl);
    } catch {
      continue;
    }
  }

  throw new Error("All Solana RPC endpoints failed");
}

export async function confirmTransaction(
  rpc: SolanaRpc,
  signatureStr: string,
): Promise<boolean> {
  const result = await rpc
    .getSignatureStatuses([createSignature(signatureStr)])
    .send();
  const status = result.value[0];
  return status !== null && status.err === null;
}
