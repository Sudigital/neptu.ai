import { useState, useCallback, useRef } from "react";

import { connectWallet, disconnectWallet } from "../services/solana-mobile";
import { clearAll } from "../services/storage";
import {
  setWalletAddress as setApiWallet,
  getOrCreateUser,
} from "../services/voice-api";

interface UseSolanaWalletReturn {
  walletAddress: string | null;
  isConnecting: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  error: string | null;
}

export function useSolanaWallet(): UseSolanaWalletReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authTokenRef = useRef<string>("");

  const connect = useCallback(async (): Promise<string | null> => {
    setIsConnecting(true);
    setError(null);

    try {
      // Step 1: Connect wallet via MWA
      const { address, authToken } = await connectWallet();
      authTokenRef.current = authToken;

      // Step 2: Set wallet for API requests (same as web's setWalletHeader)
      setApiWallet(address);
      setWalletAddress(address);

      // Step 3: Get or create user profile (same as web)
      await getOrCreateUser(address);

      return address;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(msg);
      setWalletAddress(null);
      setApiWallet(null);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (authTokenRef.current) {
        await disconnectWallet(authTokenRef.current);
      }
    } catch {
      // Non-critical: wallet may already be disconnected
    }
    authTokenRef.current = "";
    setWalletAddress(null);
    setApiWallet(null);
    clearAll();
  }, []);

  return {
    walletAddress,
    isConnecting,
    connect,
    disconnect,
    error,
  };
}
