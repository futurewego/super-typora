import type { SaveState } from "@/stores/editor-store";

const LABELS: Record<SaveState, string> = {
  dirty: "Dirty",
  saving: "Saving",
  saved: "Saved",
  error: "Error",
};

const TONES: Record<SaveState, string> = {
  dirty: "text-[color:var(--accent)] bg-[color:var(--accent-soft)]",
  saving: "text-[color:var(--accent-cool)] bg-[color:var(--accent-cool)]/12",
  saved: "text-emerald-700 bg-emerald-500/12 dark:text-emerald-300",
  error: "text-rose-700 bg-rose-500/12 dark:text-rose-300",
};

interface SaveIndicatorProps {
  saveState: SaveState;
}

export function SaveIndicator({ saveState }: SaveIndicatorProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${TONES[saveState]}`}
    >
      {LABELS[saveState]}
    </span>
  );
}
