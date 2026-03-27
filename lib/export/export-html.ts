import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

function sanitizeFileName(title: string) {
  const cleaned = title.trim().replace(/[^a-zA-Z0-9-_ ]+/g, "").replace(/\s+/g, "-");
  return cleaned || "untitled";
}

function triggerDownload(fileName: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

export function buildHtmlDocument(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #f7f1e7;
        --fg: #181818;
        --surface: #fffaf3;
        --line: rgba(24, 24, 24, 0.12);
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #101618;
          --fg: #edf0ef;
          --surface: #162024;
          --line: rgba(237, 240, 239, 0.12);
        }
      }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--fg);
        font-family: "IBM Plex Sans", ui-sans-serif, sans-serif;
      }
      main {
        max-width: 860px;
        margin: 0 auto;
        padding: 48px 24px 96px;
      }
      article {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 32px;
      }
      pre {
        overflow: auto;
        padding: 16px;
        border-radius: 16px;
      }
      code,
      pre {
        font-family: "IBM Plex Mono", ui-monospace, monospace;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 10px 12px;
        border: 1px solid var(--line);
      }
    </style>
  </head>
  <body>
    <main>
      <article>${bodyHtml}</article>
    </main>
  </body>
</html>`;
}

export async function renderMarkdownToHtml(markdown: string) {
  const rendered = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);

  return String(rendered);
}

export async function downloadHtml(title: string, markdown: string) {
  const bodyHtml = await renderMarkdownToHtml(markdown);
  const documentHtml = buildHtmlDocument(title, bodyHtml);

  triggerDownload(
    `${sanitizeFileName(title)}.html`,
    "text/html;charset=utf-8",
    documentHtml,
  );
}
