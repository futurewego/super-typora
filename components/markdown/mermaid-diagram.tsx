"use client";

import { useEffect, useId, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reactId = useId();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const mermaid = await import("mermaid");

        mermaid.default.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
        });

        const id = `mermaid-${reactId.replace(/:/g, "-")}`;
        const { svg } = await mermaid.default.render(id, chart);

        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSvg(null);
          setError(caughtError instanceof Error ? caughtError.message : "Failed to render diagram");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <pre className="overflow-auto rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <pre className="overflow-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-xs text-[color:var(--muted)]">
        Rendering diagram...
      </pre>
    );
  }

  return <div className="overflow-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4" dangerouslySetInnerHTML={{ __html: svg }} />;
}
