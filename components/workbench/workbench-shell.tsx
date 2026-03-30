import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import type { StoredDocument } from "@/types/document";

import { QuickActions } from "@/components/workbench/quick-actions";
import { RecentDocs } from "@/components/workbench/recent-docs";
import { RecoveryCard } from "@/components/workbench/recovery-card";

interface WorkbenchShellProps {
  accountEmail: string | null;
  recentDocs: StoredDocument[];
  recoverableDraftTitle?: string;
  onCreate: () => void;
  onImport: () => void;
  onRecover: () => void;
  onOpenDocument: (docId: string) => void;
  onToggleLanguage: () => void;
  onSignOut: () => void;
  language: AppLanguage;
}

export function WorkbenchShell({
  accountEmail,
  recentDocs,
  recoverableDraftTitle,
  onCreate,
  onImport,
  onRecover,
  onOpenDocument,
  onToggleLanguage,
  onSignOut,
  language,
}: WorkbenchShellProps) {
  const copy = getMessages(language);

  return (
    <main className="grain flex flex-1 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[var(--shadow)] backdrop-blur-xl">
          <div className="grid gap-8 border-b border-[color:var(--line)] px-6 py-8 lg:grid-cols-[1.35fr_0.65fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                  {copy.appBadge}
                </div>
                <div className="flex items-center gap-2">
                  {accountEmail ? (
                    <span className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs tracking-[0.08em] text-[color:var(--muted)]">
                      {accountEmail}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={onToggleLanguage}
                    className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
                  >
                    {copy.languageSwitch}
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-[color:var(--foreground)] sm:text-5xl lg:text-6xl">
                  {copy.heroTitle}
                </h1>
                <p className="max-w-3xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
                  {copy.heroDescription}
                </p>
              </div>

              <QuickActions
                canContinueDraft={Boolean(recoverableDraftTitle)}
                onContinueDraft={onRecover}
                onImport={onImport}
                onCreate={onCreate}
                labels={{
                  continueDraft: copy.continueDraft,
                  importMarkdown: copy.importMarkdown,
                  createDocument: copy.createDocument,
                }}
              />
            </div>

            <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[linear-gradient(160deg,rgba(255,255,255,0.5),transparent)] p-5">
              <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-3 text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                <span>{copy.workbenchNote}</span>
                <span className="font-mono">v1</span>
              </div>
              <div className="space-y-4 pt-4 text-sm leading-7 text-[color:var(--muted)]">
                <p>{copy.workbenchBody}</p>
                <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 font-mono text-xs tracking-[0.08em] text-[color:var(--foreground)]">
                  import .md
                  <br />
                  autosave draft
                  <br />
                  export clean html
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-8">
            <RecentDocs
              recentDocs={recentDocs}
              onOpenDocument={onOpenDocument}
              language={language}
            />
            <RecoveryCard
              title={recoverableDraftTitle}
              onRecover={onRecover}
              language={language}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
