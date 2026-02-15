import { SOLANA_NETWORKS, type NetworkType } from "@neptu/shared";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  signature as createSignature,
} from "@solana/kit";

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;
export type SolanaRpcSubscriptions = ReturnType<
  typeof createSolanaRpcSubscriptions
>;

export interface SolanaClient {
  rpc: SolanaRpc;
  rpcSubscriptions?: SolanaRpcSubscriptions;
  network: NetworkType;
}

const DEVNET_RPC_URL = "https://api.devnet.solana.com";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createSolanaClient(
  network: NetworkType,
  rpcUrl?: string
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
  addressStr: string
): Promise<bigint> {
  const result = await rpc.getBalance(address(addressStr)).send();
  return result.value;
}

/**
 * Fetch latest blockhash using raw fetch to avoid @solana/kit RPC issues
 * on Cloudflare Workers (403/429 from shared IP rate limiting).
 */
async function fetchBlockhashViaHttp(
  rpcUrl: string
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
 * Get latest blockhash with max retry and exponential backoff.
 * Retries up to MAX_RETRIES times, trying @solana/kit first then raw fetch per attempt.
 */
export async function getLatestBlockhash(
  rpc: SolanaRpc,
  network: NetworkType = "devnet"
): Promise<{ blockhash: string; lastValidBlockHeight: bigint }> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }

    // Try primary RPC via @solana/kit (with 5s timeout)
    try {
      const rpcPromise = rpc.getLatestBlockhash().send();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("RPC timeout")), 5000)
      );
      const result = await Promise.race([rpcPromise, timeoutPromise]);
      return {
        blockhash: result.value.blockhash,
        lastValidBlockHeight: result.value.lastValidBlockHeight,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Fallback: raw fetch to default devnet RPC
    try {
      const rpcUrl =
        network === "devnet" ? DEVNET_RPC_URL : SOLANA_NETWORKS[network].rpcUrl;
      return await fetchBlockhashViaHttp(rpcUrl);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(
    `All Solana RPC attempts failed after ${MAX_RETRIES} retries: ${lastError?.message}`
  );
}

export async function confirmTransaction(
  rpc: SolanaRpc,
  signatureStr: string
): Promise<boolean> {
  const result = await rpc
    .getSignatureStatuses([createSignature(signatureStr)])
    .send();
  const status = result.value[0];
  return status !== null && status.err === null;
}
