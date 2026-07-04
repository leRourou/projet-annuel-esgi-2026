import { markdownToNotionBlocks } from "@/modules/notion/domain/value-objects/markdown-to-notion-blocks";
import { describe, expect, it } from "vitest";

describe("markdownToNotionBlocks", () => {
  it("converts h1, h2, h3 headings", () => {
    const blocks = markdownToNotionBlocks("# Title\n## Section\n### Subsection");
    expect(blocks).toEqual([
      { type: "heading_1", text: "Title" },
      { type: "heading_2", text: "Section" },
      { type: "heading_3", text: "Subsection" },
    ]);
  });

  it("converts bullet list items", () => {
    const blocks = markdownToNotionBlocks("- Item A\n- Item B\n* Item C");
    expect(blocks).toEqual([
      { type: "bulleted_list_item", text: "Item A" },
      { type: "bulleted_list_item", text: "Item B" },
      { type: "bulleted_list_item", text: "Item C" },
    ]);
  });

  it("converts numbered list items", () => {
    const blocks = markdownToNotionBlocks("1. First\n2. Second\n3. Third");
    expect(blocks).toEqual([
      { type: "numbered_list_item", text: "First" },
      { type: "numbered_list_item", text: "Second" },
      { type: "numbered_list_item", text: "Third" },
    ]);
  });

  it("converts plain text to paragraphs", () => {
    const blocks = markdownToNotionBlocks("Hello world\nAnother line");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Hello world" },
      { type: "paragraph", text: "Another line" },
    ]);
  });

  it("skips empty lines", () => {
    const blocks = markdownToNotionBlocks("# Title\n\nParagraph");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: "heading_1", text: "Title" });
    expect(blocks[1]).toEqual({ type: "paragraph", text: "Paragraph" });
  });

  it("handles mixed content", () => {
    const md =
      "# SEO Guide\n\n## Introduction\n\nThis is a guide.\n\n- Key point one\n- Key point two";
    const blocks = markdownToNotionBlocks(md);
    expect(blocks[0]).toEqual({ type: "heading_1", text: "SEO Guide" });
    expect(blocks[1]).toEqual({ type: "heading_2", text: "Introduction" });
    expect(blocks[2]).toEqual({ type: "paragraph", text: "This is a guide." });
    expect(blocks[3]).toEqual({ type: "bulleted_list_item", text: "Key point one" });
    expect(blocks[4]).toEqual({ type: "bulleted_list_item", text: "Key point two" });
  });

  it("truncates text exceeding 2000 chars", () => {
    const longText = "a".repeat(2100);
    const blocks = markdownToNotionBlocks(longText);
    expect(blocks[0]?.text.length).toBe(2000);
  });

  it("limits output to 100 blocks", () => {
    const lines = Array.from({ length: 150 }, (_, i) => `Line ${i + 1}`).join("\n");
    const blocks = markdownToNotionBlocks(lines);
    expect(blocks.length).toBe(100);
  });
});
