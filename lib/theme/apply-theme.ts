import type { UserPreferences } from "@/types/document";

export function applyTheme(theme: UserPreferences["theme"]) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}
