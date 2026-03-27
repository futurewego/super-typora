export type DocumentSource = "blank" | "imported" | "recovered";

export interface StoredDocument {
  id: string;
  title: string;
  markdown: string;
  source: DocumentSource;
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
}

export type UpdateDocumentInput = Partial<
  Pick<StoredDocument, "title" | "markdown" | "source" | "updatedAt" | "lastOpenedAt">
>;
