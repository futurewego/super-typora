import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";

interface RecoveryCardProps {
  title?: string;
  onRecover: () => void;
  language: AppLanguage;
}

export function RecoveryCard({ title, onRecover, language }: RecoveryCardProps) {
  const copy = getMessages(language);

  if (!title) {
    return (
      <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] pb-3">
          <h2 className="text-lg font-semibold tracking-[-0.04em]">{copy.recoveryTitle}</h2>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            {copy.recoveryMeta}
          </span>
        </div>
        <div className="pt-4 text-sm leading-7 text-[color:var(--muted)]">
          {copy.noRecovery}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] pb-3">
        <h2 className="text-lg font-semibold tracking-[-0.04em]">{copy.recoveryTitle}</h2>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
          {copy.recoveryMeta}
        </span>
      </div>
      <div className="space-y-4 pt-4 text-sm leading-7 text-[color:var(--muted)]">
        <p>
          {copy.recoveryBodyPrefix}{" "}
          <span className="font-medium text-[color:var(--foreground)]">{title}</span>{" "}
          {copy.recoveryBodySuffix}
        </p>
        <button
          type="button"
          onClick={onRecover}
          className="w-full rounded-2xl border border-[color:var(--accent)]/35 bg-[color:var(--accent-soft)] px-4 py-3 text-left font-medium text-[color:var(--foreground)] transition-colors duration-200 hover:border-[color:var(--accent)]"
        >
          {copy.recoverLastDraft}
        </button>
      </div>
    </section>
  );
}
