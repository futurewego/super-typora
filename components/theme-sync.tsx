"use client";

import { useEffect } from "react";

import { getPreferences } from "@/lib/storage/preferences";
import { applyTheme } from "@/lib/theme/apply-theme";

export function ThemeSync() {
  useEffect(() => {
    applyTheme(getPreferences().theme);
  }, []);

  return null;
}
