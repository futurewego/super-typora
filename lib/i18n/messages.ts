export type AppLanguage = "zh" | "en";

export const messages = {
  zh: {
    languageSwitch: "English",
    appBadge: "本地优先 Markdown 工作台",
    heroTitle: "Super Markdown",
    heroDescription:
      "一个安静、可靠的 Markdown 工作台，支持导入、恢复、预览与导出，尽量不打断你的写作流。",
    createDocument: "新建文档",
    importMarkdown: "导入 Markdown",
    continueDraft: "继续草稿",
    workbenchNote: "工作台说明",
    workbenchBody:
      "更快进入写作，安心恢复未完成内容，不必在浏览器标签页里来回寻找。",
    recentDocuments: "最近文档",
    recentDocumentsMeta: "最近记录",
    noDocuments: "当前还没有本地文档，可以先导入 Markdown 或新建空白文档。",
    recoveryTitle: "恢复草稿",
    recoveryMeta: "恢复入口",
    noRecovery: "当前没有可恢复的草稿。",
    recoveryBodyPrefix: "继续编辑",
    recoveryBodySuffix: "的最近自动保存内容。",
    recoverLastDraft: "恢复上次草稿",
    openDocument: "打开",
    sourceLabels: {
      blank: "空白",
      imported: "导入",
      recovered: "恢复",
      cloud: "云端",
    },
    toolbar: {
      save: "保存",
      darkMode: "深色模式",
      lightMode: "浅色模式",
      exportHtml: "导出 HTML",
      exportMarkdown: "导出 Markdown",
      editorFullscreen: "编辑区全屏",
      previewFullscreen: "预览区全屏",
      exitFullscreen: "退出全屏",
    },
    panels: {
      editor: "编辑区",
      preview: "预览区",
      draft: "草稿",
      live: "实时",
    },
    saveState: {
      dirty: "未保存",
      saving: "保存中",
      saved: "已保存",
      error: "错误",
    },
  },
  en: {
    languageSwitch: "中文",
    appBadge: "Local-first markdown workbench",
    heroTitle: "Super Markdown",
    heroDescription:
      "A calm Markdown workbench for importing, recovering, previewing, and exporting without breaking your flow.",
    createDocument: "New Document",
    importMarkdown: "Import Markdown",
    continueDraft: "Continue Draft",
    workbenchNote: "Workbench note",
    workbenchBody:
      "Enter writing faster and recover unfinished work without hunting through browser tabs.",
    recentDocuments: "Recent Documents",
    recentDocumentsMeta: "Recent docs",
    noDocuments: "No local documents yet. Import a markdown file or start a blank document.",
    recoveryTitle: "Recover Draft",
    recoveryMeta: "Recovery",
    noRecovery: "No interrupted draft is waiting for recovery.",
    recoveryBodyPrefix: "Continue editing",
    recoveryBodySuffix: "from the latest autosaved state.",
    recoverLastDraft: "Recover Last Draft",
    openDocument: "Open",
    sourceLabels: {
      blank: "Blank",
      imported: "Imported",
      recovered: "Recovered",
      cloud: "Cloud",
    },
    toolbar: {
      save: "Save",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      exportHtml: "Export HTML",
      exportMarkdown: "Export Markdown",
      editorFullscreen: "Editor Fullscreen",
      previewFullscreen: "Preview Fullscreen",
      exitFullscreen: "Exit Fullscreen",
    },
    panels: {
      editor: "Editor",
      preview: "Preview",
      draft: "Draft",
      live: "Live",
    },
    saveState: {
      dirty: "Dirty",
      saving: "Saving",
      saved: "Saved",
      error: "Error",
    },
  },
} as const;

export function getMessages(language: AppLanguage) {
  return messages[language];
}
