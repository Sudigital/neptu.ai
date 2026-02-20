import { MMKV } from "react-native-mmkv";

import type { UserProfile } from "../types";

const mmkv = new MMKV({ id: "neptu-storage" });

const KEYS = {
  USER_PROFILE: "user_profile",
  LANGUAGE: "language_code",
  ONBOARDED: "onboarded",
} as const;

export function saveProfile(profile: UserProfile): void {
  mmkv.set(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function getProfile(): UserProfile | null {
  const raw = mmkv.getString(KEYS.USER_PROFILE);
  if (!raw) return null;
  return JSON.parse(raw) as UserProfile;
}

export function getLanguage(): string {
  return mmkv.getString(KEYS.LANGUAGE) ?? "en";
}

export function saveLanguage(code: string): void {
  mmkv.set(KEYS.LANGUAGE, code);
}

export function isOnboarded(): boolean {
  return mmkv.getBoolean(KEYS.ONBOARDED) ?? false;
}

export function setOnboarded(value: boolean): void {
  mmkv.set(KEYS.ONBOARDED, value);
}

export function clearAll(): void {
  mmkv.clearAll();
}
