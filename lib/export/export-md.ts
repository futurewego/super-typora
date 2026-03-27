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

export function buildMarkdownDownload(title: string, markdown: string) {
  return {
    fileName: `${sanitizeFileName(title)}.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: markdown,
  };
}

export function downloadMarkdown(title: string, markdown: string) {
  const payload = buildMarkdownDownload(title, markdown);
  triggerDownload(payload.fileName, payload.mimeType, payload.content);
}
