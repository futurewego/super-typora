import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import GithubSlugger from "github-slugger";
import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";

function flattenChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(flattenChildren).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(children)) {
    return flattenChildren(children.props.children as ReactNode);
  }

  return "";
}

function isMermaidBlock(language: string | undefined, value: string) {
  if (language === "mermaid" || language === "graph" || language === "flowchart") {
    return true;
  }

  return /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|journey|pie|mindmap|timeline|quadrantChart)\b/m.test(
    value.trim(),
  );
}

export function RenderMarkdown({ markdown }: { markdown: string }) {
  const slugger = new GithubSlugger();

  const headingClasses = {
    h1: "mb-6 mt-2 text-4xl font-bold tracking-[-0.06em] text-[color:var(--foreground)] sm:text-5xl",
    h2: "mb-5 mt-8 text-3xl font-bold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[2rem]",
    h3: "mb-4 mt-7 text-2xl font-bold tracking-[-0.04em] text-[color:var(--foreground)] sm:text-[1.7rem]",
    h4: "mb-3 mt-6 text-xl font-bold tracking-[-0.03em] text-[color:var(--foreground)] sm:text-[1.35rem]",
    h5: "mb-3 mt-5 text-lg font-bold tracking-[-0.02em] text-[color:var(--foreground)]",
    h6: "mb-2 mt-4 text-base font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]",
  } as const;

  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-code:before:hidden prose-code:after:hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
        components={{
          table: ({ children }) => (
            <div className="my-6 overflow-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[color:var(--surface-strong)]">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-[color:var(--line)] last:border-b-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border-r border-[color:var(--line)] px-4 py-3 text-left text-sm font-semibold text-[color:var(--foreground)] last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-r border-[color:var(--line)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)] last:border-r-0">
              {children}
            </td>
          ),
          pre: ({ children }) => {
            const value = flattenChildren(children).replace(/\n$/, "");
            const language =
              isValidElement<{ className?: string }>(children) &&
              children.props.className
                ? /language-(\w+)/.exec(children.props.className)?.[1]
                : undefined;

            if (isMermaidBlock(language, value)) {
              return <MermaidDiagram chart={value} />;
            }

            return (
              <pre className="overflow-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-xs text-[color:var(--muted)]">
                {children}
              </pre>
            );
          },
          h1: ({ children }) => {
            const id = slugger.slug(flattenChildren(children));
            return (
              <h1 id={id} className={headingClasses.h1}>
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = slugger.slug(flattenChildren(children));
            return (
              <h2 id={id} className={headingClasses.h2}>
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = slugger.slug(flattenChildren(children));
            return (
              <h3 id={id} className={headingClasses.h3}>
                {children}
              </h3>
            );
          },
          h4: ({ children }) => {
            const id = slugger.slug(flattenChildren(children));
            return (
              <h4 id={id} className={headingClasses.h4}>
                {children}
              </h4>
            );
          },
          h5: ({ children }) => {
            const id = slugger.slug(flattenChildren(children));
            return (
              <h5 id={id} className={headingClasses.h5}>
                {children}
              </h5>
            );
          },
          h6: ({ children }) => {
            const id = slugger.slug(flattenChildren(children));
            return (
              <h6 id={id} className={headingClasses.h6}>
                {children}
              </h6>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
