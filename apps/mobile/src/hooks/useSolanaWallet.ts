import { useState, useCallback, useRef } from "react";

import { connectWallet, disconnectWallet } from "../services/solana-mobile";
import {
  clearAll,
  saveMwaAuthToken,
  saveProfile,
  setOnboarded,
} from "../services/storage";
import {
  setWalletAddress as setApiWallet,
  authenticateWallet,
  clearAccessToken,
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
      saveMwaAuthToken(authToken);

      // Step 2: Set wallet for API requests
      setApiWallet(address);
      setWalletAddress(address);

      // Step 3: Authenticate with API to get PASETO access token
      // Then sync profile from server → MMKV (same source of truth as web)
      try {
        await authenticateWallet(address);
        const result = await getOrCreateUser(address);
        if (result?.user) {
          saveProfile(result.user);
          if (result.user.onboarded) {
            setOnboarded(true);
          }
        }
      } catch {
        // API might be unavailable in dev — continue with wallet connected
      }

      return address;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect wallet";
      // User cancelled / Phantom closed
      if (
        msg.includes("cancel") ||
        msg.includes("declined") ||
        msg.includes("USER_DECLINED")
      ) {
        setError("Connection cancelled. Try again.");
      } else if (msg.includes("not found") || msg.includes("No wallet")) {
        setError("No Solana wallet found. Install Phantom or Solflare.");
      } else {
        setError(msg);
      }
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
    clearAccessToken();
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
