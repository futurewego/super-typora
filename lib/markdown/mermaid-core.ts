/**
 * Mermaid 渲染核心——命令式、与框架无关。
 * 被两条渲染链复用：
 * - 只读预览：`MermaidDiagram`（React 组件）
 * - WYSIWYG（Crepe）代码块预览面板：`renderPreview` 钩子（命令式 DOM）
 */

/** mermaid 代码块语言别名 */
const MERMAID_LANGS = new Set(["mermaid", "graph", "flowchart"]);

/** 内容首词命中 mermaid 图类型关键字时，也按图处理（容错无语言标注的块） */
const MERMAID_KEYWORD =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|journey|pie|mindmap|timeline|quadrantChart)\b/m;

export function isMermaidLanguage(language: string | undefined, value = "") {
  if (language && MERMAID_LANGS.has(language)) {
    return true;
  }
  return MERMAID_KEYWORD.test(value.trim());
}

export function normalizeMermaidChart(chart: string) {
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

/**
 * 渲染 mermaid 源码为 SVG 字符串。语法错误时抛出，调用方决定降级展示。
 */
export async function renderMermaidSvg(chart: string): Promise<string> {
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

  if (/<text[^>]*>\s*Syntax error in text/i.test(rendered.svg)) {
    throw new Error("Mermaid reported a syntax error");
  }

  return rendered.svg;
}
