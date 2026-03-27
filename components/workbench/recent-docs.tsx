import type { StoredDocument } from "@/types/document";
import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";

interface RecentDocsProps {
  recentDocs: StoredDocument[];
  onOpenDocument: (docId: string) => void;
  language: AppLanguage;
}

export function RecentDocs({
  recentDocs,
  onOpenDocument,
  language,
}: RecentDocsProps) {
  const copy = getMessages(language);

  return (
    <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] pb-3">
        <h2 className="text-lg font-semibold tracking-[-0.04em]">{copy.recentDocuments}</h2>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
          {copy.recentDocumentsMeta}
        </span>
      </div>

      <div className="space-y-3 pt-4">
        {recentDocs.length > 0 ? (
          recentDocs.map((document) => (
            <article
              key={document.id}
              className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-medium">{document.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {copy.sourceLabels[document.source]} · {new Date(document.updatedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`${copy.openDocument} ${document.title}`}
                  onClick={() => onOpenDocument(document.id)}
                  className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)]"
                >
                  {copy.openDocument}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-6 text-sm leading-7 text-[color:var(--muted)]">
            {copy.noDocuments}
          </div>
        )}
      </div>
    </section>
  );
}
