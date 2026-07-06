"use client";

import { useEffect, useRef } from "react";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import {
  EditorState,
  Compartment,
  StateField,
  type Range,
} from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import {
  syntaxTree,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";

import { isMermaidLanguage, renderMermaidSvg } from "@/lib/markdown/mermaid-core";

/**
 * Typora / Obsidian 式 Live Preview 编辑器（CodeMirror 6）。
 * doc 始终是 markdown 原文（唯一真相），装饰层只做视觉就地渲染 → 格式 byte 级无损。
 * 两层装饰：ViewPlugin（行内 + 图片，视口优化、IME 组合期跳过）+ StateField（代码/mermaid/表格 block widget）。
 */
interface LivePreviewEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  mode?: "live" | "source";
  theme?: "light" | "dark";
}

// —— 行内装饰 ——
const hideMark = Decoration.replace({});
const strongDeco = Decoration.mark({ class: "cm-lp-strong" });
const emDeco = Decoration.mark({ class: "cm-lp-em" });
const codeDeco = Decoration.mark({ class: "cm-lp-code" });
const strikeDeco = Decoration.mark({ class: "cm-lp-strike" });
const headingDeco = (level: number) =>
  Decoration.mark({ class: `cm-lp-h cm-lp-h${level}` });

function selectionTouches(state: EditorState, from: number, to: number): boolean {
  return state.selection.ranges.some((r) => r.from <= to && r.to >= from);
}

// —— 块级 widget（纯 DOM，不用 React）——
class CodeBlockWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly lang: string,
  ) {
    super();
  }
  eq(o: CodeBlockWidget) {
    return o.code === this.code && o.lang === this.lang;
  }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.className = "cm-lp-codeblock";
    if (this.lang) {
      const tag = document.createElement("span");
      tag.className = "cm-lp-codeblock-lang";
      tag.textContent = this.lang;
      wrap.appendChild(tag);
    }
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = this.code;
    pre.appendChild(code);
    wrap.appendChild(pre);
    return wrap;
  }
}

class MermaidWidget extends WidgetType {
  constructor(readonly code: string) {
    super();
  }
  eq(o: MermaidWidget) {
    return o.code === this.code;
  }
  toDOM() {
    const el = document.createElement("div");
    el.className = "cm-lp-mermaid";
    el.textContent = "渲染图表…";
    void renderMermaidSvg(this.code)
      .then((svg) => {
        el.innerHTML = svg;
      })
      .catch(() => {
        el.textContent = "⚠ 图表语法错误";
        el.classList.add("cm-lp-block-error");
      });
    return el;
  }
}

class ImageWidget extends WidgetType {
  constructor(
    readonly url: string,
    readonly alt: string,
  ) {
    super();
  }
  eq(o: ImageWidget) {
    return o.url === this.url && o.alt === this.alt;
  }
  toDOM() {
    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.className = "cm-lp-img";
    return img;
  }
}

class TableWidget extends WidgetType {
  constructor(readonly md: string) {
    super();
  }
  eq(o: TableWidget) {
    return o.md === this.md;
  }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.className = "cm-lp-table-wrap";
    const table = document.createElement("table");
    table.className = "cm-lp-table";
    const lines = this.md.split("\n").filter((l) => l.trim());
    lines.forEach((line, idx) => {
      if (idx === 1) {
        return; // 跳过分隔行 |---|
      }
      const cells = line
        .replace(/^\s*\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map((c) => c.trim());
      const tr = document.createElement("tr");
      cells.forEach((c) => {
        const cell = document.createElement(idx === 0 ? "th" : "td");
        cell.textContent = c;
        tr.appendChild(cell);
      });
      table.appendChild(tr);
    });
    wrap.appendChild(table);
    return wrap;
  }
}

// —— 行内装饰（ViewPlugin）——
function buildInlineDecorations(view: EditorView): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const state = view.state;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name;
        const f = node.from;
        const t = node.to;

        // 块级由 StateField 处理，这里跳过其内部
        if (name === "FencedCode" || name === "CodeBlock" || name === "Table") {
          return false;
        }

        const active = selectionTouches(state, f, t);

        if (name === "StrongEmphasis") {
          ranges.push(strongDeco.range(f, t));
          if (!active) {
            ranges.push(hideMark.range(f, f + 2));
            ranges.push(hideMark.range(t - 2, t));
          }
        } else if (name === "Emphasis") {
          ranges.push(emDeco.range(f, t));
          if (!active) {
            ranges.push(hideMark.range(f, f + 1));
            ranges.push(hideMark.range(t - 1, t));
          }
        } else if (name === "InlineCode") {
          ranges.push(codeDeco.range(f, t));
          if (!active) {
            ranges.push(hideMark.range(f, f + 1));
            ranges.push(hideMark.range(t - 1, t));
          }
        } else if (name === "Strikethrough") {
          ranges.push(strikeDeco.range(f, t));
          if (!active) {
            ranges.push(hideMark.range(f, f + 2));
            ranges.push(hideMark.range(t - 2, t));
          }
        } else if (name === "Image") {
          if (!active) {
            const raw = state.doc.sliceString(f, t);
            const m = /^!\[([^\]]*)\]\(([^)\s]+)/.exec(raw);
            if (m) {
              ranges.push(
                Decoration.replace({
                  widget: new ImageWidget(m[2], m[1]),
                }).range(f, t),
              );
            }
          }
        } else {
          const hm = /^ATXHeading(\d)$/.exec(name);
          if (hm) {
            const level = Number(hm[1]);
            ranges.push(headingDeco(level).range(f, t));
            if (!active) {
              const line = state.doc.lineAt(f);
              const mk = /^#{1,6}\s/.exec(line.text);
              if (mk) {
                ranges.push(hideMark.range(line.from, line.from + mk[0].length));
              }
            }
          }
        }
      },
    });
  }
  return Decoration.set(ranges, true);
}

const inlinePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildInlineDecorations(view);
    }
    update(u: ViewUpdate) {
      if (u.view.composing) {
        return; // IME 组合期不重算，保护中文输入
      }
      if (u.docChanged || u.selectionSet || u.viewportChanged) {
        this.decorations = buildInlineDecorations(u.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

// —— 块级富块装饰（StateField，跨行 block widget 必须走这里）——
function buildBlockDecorations(state: EditorState): DecorationSet {
  const ranges: Range<Decoration>[] = [];

  syntaxTree(state).iterate({
    enter: (node) => {
      const name = node.name;
      const f = node.from;
      const t = node.to;

      if (name === "FencedCode" || name === "CodeBlock") {
        if (!selectionTouches(state, f, t)) {
          const infoNode = node.node.getChild("CodeInfo");
          const textNode = node.node.getChild("CodeText");
          const lang = infoNode
            ? state.doc.sliceString(infoNode.from, infoNode.to).trim()
            : "";
          const code = textNode
            ? state.doc.sliceString(textNode.from, textNode.to)
            : "";
          const lineFrom = state.doc.lineAt(f).from;
          const lineTo = state.doc.lineAt(Math.max(f, t - 1)).to;
          if (isMermaidLanguage(lang, code)) {
            ranges.push(
              Decoration.replace({
                widget: new MermaidWidget(code),
                block: true,
              }).range(lineFrom, lineTo),
            );
          } else {
            ranges.push(
              Decoration.replace({
                widget: new CodeBlockWidget(code, lang),
                block: true,
              }).range(lineFrom, lineTo),
            );
          }
        }
        return false;
      }

      if (name === "Table") {
        if (!selectionTouches(state, f, t)) {
          const md = state.doc.sliceString(f, t);
          const lineFrom = state.doc.lineAt(f).from;
          const lineTo = state.doc.lineAt(Math.max(f, t - 1)).to;
          ranges.push(
            Decoration.replace({
              widget: new TableWidget(md),
              block: true,
            }).range(lineFrom, lineTo),
          );
        }
        return false;
      }
    },
  });

  return Decoration.set(ranges, true);
}

const blockField = StateField.define<DecorationSet>({
  create: (state) => buildBlockDecorations(state),
  update(deco, tr) {
    if (tr.docChanged || tr.selection) {
      return buildBlockDecorations(tr.state);
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "15px",
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-sans)",
    lineHeight: "1.75",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    caretColor: "var(--accent)",
    maxWidth: "48rem",
    margin: "0 auto",
    // 底部留白必须放在 .cm-content（CM6 高度模型能感知），不能放 .cm-scroller，
    // 否则 CM6 内部滚动高度与浏览器 scrollHeight 不一致，滚动时被校正拉回 → 反弹
    padding: "0.5rem 0.75rem 35vh",
  },
  ".cm-line": { padding: "0 2px" },
  ".cm-lp-strong": { fontWeight: "700" },
  ".cm-lp-em": { fontStyle: "italic" },
  ".cm-lp-strike": { textDecoration: "line-through", opacity: "0.7" },
  ".cm-lp-code": {
    fontFamily: "var(--font-mono)",
    fontSize: "0.9em",
    background: "var(--accent-soft)",
    borderRadius: "4px",
    padding: "0.1em 0.3em",
  },
  ".cm-lp-h": { fontWeight: "700", lineHeight: "1.3" },
  ".cm-lp-h1": { fontSize: "1.8em" },
  ".cm-lp-h2": { fontSize: "1.5em" },
  ".cm-lp-h3": { fontSize: "1.3em" },
  ".cm-lp-h4": { fontSize: "1.15em" },
  ".cm-lp-h5": { fontSize: "1.05em" },
  ".cm-lp-h6": { fontSize: "1em", opacity: "0.85" },
  ".cm-lp-codeblock": {
    position: "relative",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "8px",
    padding: "12px 14px",
    margin: "8px 0",
    overflowX: "auto",
  },
  ".cm-lp-codeblock-lang": {
    position: "absolute",
    top: "6px",
    right: "10px",
    fontSize: "11px",
    color: "var(--muted)",
    fontFamily: "var(--font-mono)",
  },
  ".cm-lp-codeblock pre": { margin: "0" },
  ".cm-lp-codeblock code": {
    fontFamily: "var(--font-mono)",
    fontSize: "0.85em",
    whiteSpace: "pre",
  },
  ".cm-lp-mermaid": {
    display: "flex",
    justifyContent: "center",
    padding: "12px 0",
    background: "var(--surface)",
    borderRadius: "8px",
    margin: "8px 0",
    color: "var(--muted)",
  },
  ".cm-lp-mermaid svg": { maxWidth: "100%", height: "auto" },
  ".cm-lp-block-error": {
    color: "#ff453a",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
  ".cm-lp-img": {
    maxWidth: "100%",
    borderRadius: "6px",
    display: "block",
    margin: "8px 0",
  },
  ".cm-lp-table-wrap": { overflowX: "auto", margin: "8px 0" },
  ".cm-lp-table": { borderCollapse: "collapse" },
  ".cm-lp-table th, .cm-lp-table td": {
    border: "1px solid var(--line)",
    padding: "6px 10px",
    fontSize: "0.9em",
    textAlign: "left",
  },
  ".cm-lp-table th": { background: "var(--surface)", fontWeight: "600" },
});

export function LivePreviewEditor({
  value,
  onChange,
  mode = "live",
}: LivePreviewEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lpCompartment = useRef(new Compartment());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        markdown({ base: markdownLanguage }),
        syntaxHighlighting(defaultHighlightStyle),
        lpCompartment.current.of(
          mode === "live" ? [inlinePlugin, blockField] : [],
        ),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            onChangeRef.current(u.state.doc.toString());
          }
        }),
        editorTheme,
      ],
    });

    const view = new EditorView({ state, parent: host });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    view.dispatch({
      effects: lpCompartment.current.reconfigure(
        mode === "live" ? [inlinePlugin, blockField] : [],
      ),
    });
  }, [mode]);

  return <div ref={hostRef} className="cm-lp-host h-full min-h-0 overflow-hidden" />;
}
