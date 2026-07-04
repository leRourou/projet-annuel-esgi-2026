/**
 * Converts a Markdown string into a list of Notion block descriptors.
 * Handles: h1-h3, bullet lists, numbered lists, paragraphs.
 * Kept simple and pure (no external deps) — Notion SDK types used in the adapter layer.
 */

export type NotionBlockDescriptor =
  | { type: "heading_1"; text: string }
  | { type: "heading_2"; text: string }
  | { type: "heading_3"; text: string }
  | { type: "bulleted_list_item"; text: string }
  | { type: "numbered_list_item"; text: string }
  | { type: "paragraph"; text: string };

const MAX_TEXT_LENGTH = 2000;

function truncate(text: string): string {
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
}

export function markdownToNotionBlocks(markdown: string): NotionBlockDescriptor[] {
  const lines = markdown.split("\n");
  const blocks: NotionBlockDescriptor[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) continue;

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading_3", text: truncate(line.slice(4)) });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "heading_2", text: truncate(line.slice(3)) });
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "heading_1", text: truncate(line.slice(2)) });
    } else if (/^[-*] /.test(line)) {
      blocks.push({ type: "bulleted_list_item", text: truncate(line.slice(2)) });
    } else if (/^\d+\. /.test(line)) {
      blocks.push({ type: "numbered_list_item", text: truncate(line.replace(/^\d+\. /, "")) });
    } else {
      blocks.push({ type: "paragraph", text: truncate(line) });
    }
  }

  // Notion has a 100-block limit per API call — slice if exceeded
  return blocks.slice(0, 100);
}
