/**
 * Pure Markdown → HTML / plain text conversion (no external deps).
 * Handles: h1-h4, bullet lists, numbered lists, paragraphs, bold/italic/links.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1");
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const htmlLines: string[] = [];
  let listBuffer: string[] = [];
  let listTag: "ul" | "ol" | null = null;

  function flushList(): void {
    if (listTag && listBuffer.length > 0) {
      htmlLines.push(`<${listTag}>\n${listBuffer.join("\n")}\n</${listTag}>`);
    }
    listBuffer = [];
    listTag = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,4}) (.+)$/.exec(line);
    if (headingMatch?.[1] && headingMatch[2]) {
      flushList();
      const level = headingMatch[1].length;
      htmlLines.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (/^[-*] /.test(line)) {
      if (listTag !== "ul") flushList();
      listTag = "ul";
      listBuffer.push(`<li>${renderInline(line.slice(2))}</li>`);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      if (listTag !== "ol") flushList();
      listTag = "ol";
      listBuffer.push(`<li>${renderInline(line.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }

    flushList();
    htmlLines.push(`<p>${renderInline(line)}</p>`);
  }
  flushList();

  return htmlLines.join("\n");
}

export function markdownToPlainText(markdown: string): string {
  const lines = markdown.split("\n");
  const textLines: string[] = [];
  let lastWasBlank = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (!lastWasBlank) textLines.push("");
      lastWasBlank = true;
      continue;
    }
    lastWasBlank = false;

    const stripped = line
      .replace(/^#{1,4} /, "")
      .replace(/^[-*] /, "")
      .replace(/^\d+\. /, "");
    textLines.push(stripInline(stripped));
  }

  return textLines.join("\n").trim();
}
