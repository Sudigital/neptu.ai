import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useCallback, useEffect, useRef } from "react";

export function useAuth() {
  const {
    primaryWallet,
    sdkHasLoaded,
    user: dynamicUser,
    setShowAuthFlow,
    handleLogOut,
  } = useDynamicContext();
  const isDynamicLoggedIn = useIsLoggedIn();
  const wasLoggedIn = useRef(isDynamicLoggedIn);

  // Full reload on disconnect to clear all cached state
  useEffect(() => {
    if (wasLoggedIn.current && !isDynamicLoggedIn) {
      window.location.href = "/";
    }
    wasLoggedIn.current = isDynamicLoggedIn;
  }, [isDynamicLoggedIn]);

  const walletAddress = primaryWallet?.address ?? "";

  // Authenticated = wallet connected via Dynamic SDK session
  const isAuthenticated = isDynamicLoggedIn;
  const ready = sdkHasLoaded;

  const showLogin = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  const logout = useCallback(() => {
    handleLogOut();
    window.location.href = "/";
  }, [handleLogOut]);

  return {
    walletAddress,
    wallet: primaryWallet ?? null,
    isAuthenticated,
    isFullyAuthenticated: isAuthenticated,
    isAuthenticating: false,
    ready,
    displayEmail: dynamicUser?.email ?? "",
    dynamicUser,
    showLogin,
    signIn: showLogin,
    logout,
  };
}
