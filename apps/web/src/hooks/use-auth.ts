import {
  useAuthenticateConnectedUser,
  useDynamicContext,
  useIsLoggedIn,
} from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export function useAuth() {
  const {
    primaryWallet,
    sdkHasLoaded,
    user: dynamicUser,
    setShowAuthFlow,
    handleLogOut,
  } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const { authenticateUser, isAuthenticating } = useAuthenticateConnectedUser();

  const walletAddress = primaryWallet?.address ?? "";
  // Fully verified: user signed and JWT was issued
  const isFullyAuthenticated = isLoggedIn && !!dynamicUser;
  // Connected: wallet is connected (may or may not have signed)
  const isAuthenticated = isFullyAuthenticated || !!primaryWallet;
  const ready = sdkHasLoaded;

  const showLogin = useCallback(() => {
    if (!primaryWallet) {
      // No wallet connected — open the auth modal
      setShowAuthFlow(true);
    }
  }, [primaryWallet, setShowAuthFlow]);

  const requestSignature = useCallback(() => {
    if (primaryWallet && !isFullyAuthenticated) {
      authenticateUser();
    }
  }, [primaryWallet, isFullyAuthenticated, authenticateUser]);

  const logout = async () => {
    await handleLogOut();
    window.location.href = "/";
  };

  return {
    walletAddress,
    wallet: primaryWallet ?? null,
    isAuthenticated,
    isFullyAuthenticated,
    isAuthenticating,
    ready,
    displayEmail: dynamicUser?.email ?? "",
    dynamicUser,
    showLogin,
    requestSignature,
    logout,
  };
}
