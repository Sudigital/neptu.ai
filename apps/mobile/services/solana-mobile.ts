import {
  transact,
  type Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { SOLANA_RPC_URL, SOLANA_CLUSTER } from "../constants";

const APP_IDENTITY = {
  name: "Neptu",
  uri: "https://neptu.ai",
  icon: "https://neptu.ai/favicon.ico",
};

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// Connect wallet via MWA
export async function connectWallet(): Promise<{
  address: string;
  authToken: string;
}> {
  const result = await transact(async (wallet: Web3MobileWallet) => {
    const auth = await wallet.authorize({
      cluster: SOLANA_CLUSTER as "devnet" | "testnet" | "mainnet-beta",
      identity: APP_IDENTITY,
    });
    return {
      address: new PublicKey(auth.accounts[0].address).toBase58(),
      authToken: auth.auth_token,
    };
  });
  return result;
}

// Disconnect wallet
export async function disconnectWallet(authToken: string): Promise<void> {
  await transact(async (wallet: Web3MobileWallet) => {
    await wallet.deauthorize({ auth_token: authToken });
  });
}

// Sign a message (for auth nonce verification)
export async function signMessage(
  message: string,
  authToken: string
): Promise<string> {
  const result = await transact(async (wallet: Web3MobileWallet) => {
    await wallet.reauthorize({ auth_token: authToken, identity: APP_IDENTITY });

    const encoded = new TextEncoder().encode(message);
    const signatures = await wallet.signMessages({
      addresses: [],
      payloads: [encoded],
    });
    return Buffer.from(signatures[0]).toString("base64");
  });
  return result;
}

// Sign and send a transaction (for payments)
export async function signAndSendTransaction(
  serializedTx: string,
  authToken: string
): Promise<string> {
  const result = await transact(async (wallet: Web3MobileWallet) => {
    await wallet.reauthorize({ auth_token: authToken, identity: APP_IDENTITY });

    const txBuffer = Buffer.from(serializedTx, "base64");
    const transaction = Transaction.from(txBuffer);

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signatures = await wallet.signAndSendTransactions({
      transactions: [transaction],
    });

    return signatures[0] ? Buffer.from(signatures[0]).toString("base64") : "";
  });
  return result;
}

// Get SOL balance directly
export async function getSolBalance(address: string): Promise<number> {
  const pubkey = new PublicKey(address);
  const lamports = await connection.getBalance(pubkey);
  const LAMPORTS_PER_SOL = 1_000_000_000;
  return lamports / LAMPORTS_PER_SOL;
}
