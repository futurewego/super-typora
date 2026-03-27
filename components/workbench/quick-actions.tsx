interface QuickActionsProps {
  canContinueDraft: boolean;
  onContinueDraft: () => void;
  onImport: () => void;
  onCreate: () => void;
  labels: {
    continueDraft: string;
    importMarkdown: string;
    createDocument: string;
  };
}

export function QuickActions({
  canContinueDraft,
  onContinueDraft,
  onImport,
  onCreate,
  labels,
}: QuickActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={onContinueDraft}
        disabled={!canContinueDraft}
        className="rounded-2xl bg-[color:var(--foreground)] px-4 py-4 text-left text-[15px] font-medium text-[color:var(--background)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {labels.continueDraft}
      </button>
      <button
        type="button"
        onClick={onImport}
        className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-4 text-left text-[15px] font-medium transition-colors duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--accent-soft)]"
      >
        {labels.importMarkdown}
      </button>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-4 text-left text-[15px] font-medium transition-colors duration-200 hover:border-[color:var(--accent-cool)]/50 hover:bg-[color:var(--accent-cool)]/10"
      >
        {labels.createDocument}
      </button>
    </div>
  );
}
