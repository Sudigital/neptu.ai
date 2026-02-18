import type { Wallet } from "@dynamic-labs/wallet-connector-core";

import { requestNonce, verifySignature } from "@/lib/auth-api";
import { usePasetoAuthStore } from "@/stores/paseto-auth-store";
import { isSolanaWallet } from "@dynamic-labs/solana";
import { useCallback, useEffect, useRef } from "react";

// Module-level guard: survives React StrictMode remounts and re-renders.
// Cleared only on full page reload or explicit retry.
const attemptedWallets = new Set<string>();

/**
 * Bridges Dynamic Labs wallet connection to PASETO token authentication.
 *
 * After a wallet connects via Dynamic Labs, this hook automatically:
 * 1. Requests a nonce from the API
 * 2. Signs the nonce message with the connected wallet
 * 3. Verifies the signature with the API to get PASETO tokens
 * 4. Stores the session (tokens + user) for persistent auth
 *
 * On subsequent visits, persisted tokens from localStorage are restored by
 * the Zustand store so users don't need to re-sign.
 *
 * If the user rejects the signature, no re-prompt happens until they
 * reconnect or manually call `retrySignIn()`.
 */
export function usePasetoSignIn(
  wallet: Wallet | null,
  isDynamicLoggedIn: boolean
) {
  const {
    isAuthenticated: hasPasetoSession,
    isSigningIn,
    setSession,
    setSigningIn,
    clearSession,
  } = usePasetoAuthStore();

  const signingRef = useRef(false);

  const performSignIn = useCallback(
    async (currentWallet: Wallet) => {
      if (signingRef.current) return;
      signingRef.current = true;
      setSigningIn(true);

      const walletAddress = currentWallet.address;

      try {
        const nonceResponse = await requestNonce(walletAddress);

        if (!nonceResponse.success) {
          throw new Error("Failed to request nonce");
        }

        if (!isSolanaWallet(currentWallet)) {
          throw new Error("Only Solana wallets are supported");
        }

        const signer = await currentWallet.getSigner();
        const messageBytes = new TextEncoder().encode(nonceResponse.message);
        const { signature: signatureBytes } =
          await signer.signMessage(messageBytes);

        const HEX_RADIX = 16;
        const signature = Array.from(signatureBytes)
          .map((b) => b.toString(HEX_RADIX).padStart(2, "0"))
          .join("");

        const verifyResponse = await verifySignature(walletAddress, signature);

        if (!verifyResponse.success) {
          throw new Error("Signature verification failed");
        }

        setSession(
          verifyResponse.user,
          verifyResponse.accessToken,
          verifyResponse.refreshToken
        );
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("PASETO sign-in failed:", error);
        }
      } finally {
        signingRef.current = false;
        setSigningIn(false);
      }
    },
    [setSession, setSigningIn]
  );

  // Auto sign-in disabled — PASETO signing only via explicit retrySignIn()
  const walletAddress = wallet?.address ?? null;

  // Clear on disconnect
  useEffect(() => {
    if (!isDynamicLoggedIn && hasPasetoSession) {
      clearSession();
    }
    if (!isDynamicLoggedIn && walletAddress) {
      attemptedWallets.delete(walletAddress);
    }
  }, [isDynamicLoggedIn, hasPasetoSession, clearSession, walletAddress]);

  const retrySignIn = useCallback(() => {
    if (!wallet) return;
    attemptedWallets.delete(wallet.address);
    performSignIn(wallet);
  }, [wallet, performSignIn]);

  return { isSigningIn, retrySignIn };
}
