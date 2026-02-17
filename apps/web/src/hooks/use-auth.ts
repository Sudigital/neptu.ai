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

  const walletAddress = primaryWallet?.address ?? "";

  const isFullyAuthenticated = pasetoAuth.isAuthenticated;
  const isAuthenticated = isDynamicLoggedIn;
  const isAuthenticating = false;
  const ready = sdkHasLoaded;

  const showLogin = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  const logout = useCallback(async () => {
    pasetoAuth.clearSession();
    await handleLogOut();
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
    logout,
  };
}
