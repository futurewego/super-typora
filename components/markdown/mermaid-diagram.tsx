"use client";

import { useEffect, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

function normalizeMermaidChart(chart: string) {
  const lines = chart.replace(/\r\n/g, "\n").split("\n");
  const normalized: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/\t/g, "  ");

    if (trimmed.trim().length === 0) {
      normalized.push("");
      continue;
    }

    const pieces = trimmed.split(
      /(?<=[\]\)])\s{2,}(?=[A-Za-z_][A-Za-z0-9_]*\s*(?:-->|-\.|\.->|==>|---|-->))/g,
    );
    normalized.push(...pieces);
  }

  while (normalized[0] === "") normalized.shift();
  while (normalized[normalized.length - 1] === "") normalized.pop();

  return normalized.map((line) => line.replace(/\s+$/, "")).join("\n");
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const mermaid = await import("mermaid");
        const normalizedChart = normalizeMermaidChart(chart);

        mermaid.default.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
        });

        await mermaid.default.parse(normalizedChart);
        const id = `mermaid-${crypto.randomUUID()}`;
        const rendered = await mermaid.default.render(id, normalizedChart);
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

  return (
    <div
      className="overflow-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
