"use client";

import { useEffect, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
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

        await mermaid.default.parse(chart);
        const id = `mermaid-${crypto.randomUUID()}`;
        const rendered = await mermaid.default.render(id, chart);
        const nextSvg = rendered.svg;

        if (/<text[^>]*>\s*Syntax error in text/i.test(nextSvg)) {
          throw new Error("Mermaid reported a syntax error");
        }

        if (!cancelled) {
          setSvg(nextSvg);
          setFallback(false);
        }
      } catch (caughtError) {
        if (!cancelled) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.error("Mermaid render failed", caughtError);
          }
          setSvg(null);
          setFallback(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (fallback) {
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
