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

export function createSolanaClient(network: NetworkType): SolanaClient {
  const config = SOLANA_NETWORKS[network];

  const rpc = createSolanaRpc(config.rpcUrl);
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

export async function getLatestBlockhash(
  rpc: SolanaRpc,
): Promise<{ blockhash: string; lastValidBlockHeight: bigint }> {
  const result = await rpc.getLatestBlockhash().send();
  return {
    blockhash: result.value.blockhash,
    lastValidBlockHeight: result.value.lastValidBlockHeight,
  };
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
