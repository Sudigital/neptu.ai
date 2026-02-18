import { usePasetoSignIn } from "@/hooks/use-paseto-sign-in";
import { usePasetoAuthStore } from "@/stores/paseto-auth-store";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export function useAuth() {
  const {
    primaryWallet,
    sdkHasLoaded,
    user: dynamicUser,
    setShowAuthFlow,
    handleLogOut,
  } = useDynamicContext();
  const isDynamicLoggedIn = useIsLoggedIn();
  const pasetoAuth = usePasetoAuthStore();

  // Bridge Dynamic Labs wallet connection → PASETO token auth
  const { isSigningIn, retrySignIn } = usePasetoSignIn(
    primaryWallet ?? null,
    isDynamicLoggedIn
  );

  const walletAddress = primaryWallet?.address ?? "";

  // Fully authenticated = wallet connected + PASETO session valid
  const isFullyAuthenticated = isDynamicLoggedIn && pasetoAuth.isAuthenticated;
  // Allow access if wallet is connected (PASETO may still be signing in)
  const isAuthenticated = isDynamicLoggedIn;
  const isAuthenticating = isSigningIn;
  const ready = sdkHasLoaded;

  const showLogin = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  const logout = useCallback(() => {
    pasetoAuth.clearSession();
    handleLogOut();
    window.location.href = "/";
  }, [pasetoAuth, handleLogOut]);

  return {
    walletAddress,
    wallet: primaryWallet ?? null,
    isAuthenticated,
    isFullyAuthenticated,
    isAuthenticating,
    ready,
    displayEmail: dynamicUser?.email ?? "",
    dynamicUser,
    user: pasetoAuth.user,
    showLogin,
    signIn: showLogin,
    retrySignIn,
    logout,
  };
}
