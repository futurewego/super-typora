import type { UserPreferences } from "@/types/document";

const STORAGE_KEY = "super-markdown-workbench:preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  language: "zh",
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getPreferences(): UserPreferences {
  if (!canUseLocalStorage()) {
    return DEFAULT_PREFERENCES;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    return {
      ...DEFAULT_PREFERENCES,
      ...(JSON.parse(raw) as Partial<UserPreferences>),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(
  patch: Partial<UserPreferences>,
): UserPreferences {
  const nextPreferences = {
    ...getPreferences(),
    ...patch,
  } satisfies UserPreferences;

  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  }

  return nextPreferences;
}

export function resetPreferences() {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
