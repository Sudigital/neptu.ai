import { create } from "zustand";

interface AuthState {
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(() => ({
  clearTokens: () => {
    // No-op — tokens are managed by Dynamic SDK and axios headers.
    // This exists for the sign-out flow to have a clear reset point.
  },
}));
