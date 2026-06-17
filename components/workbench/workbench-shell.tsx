import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import type { StoredDocument } from "@/types/document";

interface WorkbenchShellProps {
  accountEmail: string | null;
  recentDocs: StoredDocument[];
  recoverableDraftTitle?: string;
  onCreate: () => void;
  onOpen: () => void;
  onImport: () => void;
  onRecover: () => void;
  onOpenDocument: (docId: string) => void;
  onToggleLanguage: () => void;
  onSignOut: () => void;
  language: AppLanguage;
}

function LauncherAction({
  label,
  hint,
  icon,
  onClick,
}: {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-no-drag group flex w-40 flex-col items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:shadow-[var(--shadow)]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-[color:var(--accent)] transition-colors group-hover:bg-[color:var(--accent)] group-hover:text-white">
        {icon}
      </span>
      <span className="text-sm font-semibold tracking-[-0.01em] text-[color:var(--foreground)]">
        {label}
      </span>
      {hint ? (
        <span className="text-xs text-[color:var(--muted)]">{hint}</span>
      ) : null}
    </button>
  );
}

export function WorkbenchShell({
  accountEmail,
  recentDocs,
  recoverableDraftTitle,
  onCreate,
  onOpen,
  onImport,
  onRecover,
  onOpenDocument,
  onToggleLanguage,
  onSignOut,
  language,
}: WorkbenchShellProps) {
  const copy = getMessages(language);
  const hasRealAccount = Boolean(accountEmail && accountEmail !== "local-user");

  return (
    <main className="grain flex flex-1 flex-col">
      {/* 可拖拽标题栏（hiddenInset，左侧留给交通灯） */}
      <header className="titlebar flex items-center justify-between pl-20 pr-4">
        <span className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
          SuperTypora
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          >
            {copy.languageSwitch}
          </button>
          {hasRealAccount ? (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      {/* 居中启动区 */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-semibold tracking-[-0.06em] text-[color:var(--foreground)]">
            SuperTypora
          </h1>
          <p className="text-sm text-[color:var(--muted)]">{copy.appBadge}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-stretch justify-center gap-4">
          <LauncherAction
            label={copy.createDocument}
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
            onClick={onCreate}
          />
          <LauncherAction
            label={copy.openFile}
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            }
            onClick={onOpen}
          />
          <LauncherAction
            label={copy.importMarkdown}
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
              </svg>
            }
            onClick={onImport}
          />
        </div>

        {/* 最近文档 */}
        <div className="mt-12 w-full max-w-2xl">
          <p className="mb-3 text-center text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
            {copy.recentDocuments}
          </p>
          {recentDocs.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {recentDocs.slice(0, 8).map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => onOpenDocument(document.id)}
                  title={`${copy.sourceLabels[document.source]} · ${new Date(document.updatedAt).toLocaleString()}`}
                  className="app-no-drag max-w-[16rem] truncate rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-1.5 text-sm text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                >
                  {document.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[color:var(--muted)]">
              {copy.noDocuments}
            </p>
          )}

          {recoverableDraftTitle ? (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={onRecover}
                className="app-no-drag text-sm text-[color:var(--accent)] underline-offset-4 hover:underline"
              >
                {copy.continueDraft} · {recoverableDraftTitle}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
