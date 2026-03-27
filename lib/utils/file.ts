export function isMarkdownFile(file: File) {
  const normalizedType = file.type.toLowerCase();
  const normalizedName = file.name.toLowerCase();

  return (
    normalizedName.endsWith(".md") ||
    normalizedType === "text/markdown" ||
    normalizedType === "text/plain"
  );
}

export async function readMarkdownFile(file: File) {
  if (!isMarkdownFile(file)) {
    throw new Error("Only markdown files are supported in V1.");
  }

  const markdown = await file.text();
  const title = file.name.replace(/\.md$/i, "") || "Untitled";

  return { title, markdown };
}
