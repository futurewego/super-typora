export interface ElectronFilePayload {
  content: string;
  name: string;
  path: string;
  lastModified: number;
}

export interface ElectronWriteResult {
  success: boolean;
  path: string;
  lastModified: number;
}

export interface ElectronSaveAsResult {
  canceled: boolean;
  path?: string;
  name?: string;
  lastModified?: number;
}

export interface ElectronAPI {
  isElectron: true;
  onOpenFile: (callback: (filePath: string) => void) => () => void;
  onMenuSave: (callback: () => void) => () => void;
  openFile: () => Promise<{ opened: boolean }>;
  readFile: (filePath: string) => Promise<ElectronFilePayload>;
  writeFile: (filePath: string, content: string) => Promise<ElectronWriteResult>;
  saveFileAs: (
    suggestedName: string,
    content: string,
  ) => Promise<ElectronSaveAsResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
