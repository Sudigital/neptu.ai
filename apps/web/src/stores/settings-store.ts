import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  language: string;
  setLanguage: (language: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language: string) => set({ language }),
    }),
    {
      name: "neptu-settings",
    }
  )
);
