import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

import type { ColorScheme } from "../constants";
import type { ThemeMode } from "../types";

import { COLORS, COLORS_LIGHT } from "../constants";
import { getThemeMode, saveThemeMode } from "../services/storage";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorScheme;
  isDark: boolean;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

// Default context — dark theme
const defaultValue: ThemeContextValue = {
  mode: "dark",
  colors: COLORS,
  isDark: true,
  toggle: () => {},
  setMode: () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemeProvider(): ThemeContextValue {
  const [mode, setModeState] = useState<ThemeMode>(getThemeMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    saveThemeMode(next);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const isDark = mode === "dark";
  const colors = isDark ? COLORS : COLORS_LIGHT;

  return useMemo(
    () => ({ mode, colors, isDark, toggle, setMode }),
    [mode, colors, isDark, toggle, setMode]
  );
}
