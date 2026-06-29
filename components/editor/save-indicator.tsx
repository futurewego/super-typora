import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import type { SaveState } from "@/stores/editor-store";

const TONES: Record<SaveState, string> = {
  dirty: "text-[color:var(--accent)] bg-[color:var(--accent-soft)]",
  saving: "text-[color:var(--muted)] bg-[color:var(--line)]",
  saved: "text-emerald-700 bg-emerald-500/12 dark:text-emerald-300",
  error: "text-rose-700 bg-rose-500/12 dark:text-rose-300",
};

interface SaveIndicatorProps {
  saveState: SaveState;
  language: AppLanguage;
}

export function SaveIndicator({ saveState, language }: SaveIndicatorProps) {
  const copy = getMessages(language);

  return (
    <span
      className={`rounded-md px-2 py-1 text-[11px] font-medium ${TONES[saveState]}`}
    >
      {copy.saveState[saveState]}
    </span>
  );
}
