export type DocumentSource = "blank" | "imported" | "recovered" | "cloud" | "local";

export interface StoredDocument {
  id: string;
  userId?: string;
  title: string;
  markdown: string;
  source: DocumentSource;
  version?: number;
  /** 桌面端：该文档对应的本地磁盘文件绝对路径（用于保存回原文件）。 */
  filePath?: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

export interface DraftSnapshot {
  docId: string;
  markdown: string;
  savedAt: number;
}

export interface UserPreferences {
  theme: "light" | "dark";
  language: "zh" | "en";
}

export interface CreateDocumentInput {
  title: string;
  markdown: string;
  source: DocumentSource;
  filePath?: string;
}

export type UpdateDocumentInput = Partial<
  Pick<
    StoredDocument,
    | "title"
    | "markdown"
    | "source"
    | "version"
    | "filePath"
    | "updatedAt"
    | "lastOpenedAt"
  >
>;
