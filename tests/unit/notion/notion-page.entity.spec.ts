import { NotionPage } from "@/modules/notion/domain/entities/notion-page.entity";
import { NotionBlock } from "@/modules/notion/domain/value-objects/notion-block.vo";
import { describe, expect, it } from "vitest";

function makePage() {
  return NotionPage.create("page-1", {
    title: "My Page",
    blocks: [
      NotionBlock.create("heading_1", "Introduction"),
      NotionBlock.create("paragraph", "This is a paragraph."),
      NotionBlock.create("bulleted_list_item", "Item one"),
    ],
    url: "https://notion.so/page-1",
    lastEditedAt: new Date("2025-01-01"),
  });
}

describe("NotionPage", () => {
  it("exposes title and blocks", () => {
    const page = makePage();
    expect(page.title).toBe("My Page");
    expect(page.blocks).toHaveLength(3);
  });

  it("converts to markdown", () => {
    const page = makePage();
    const md = page.toMarkdown();
    expect(md).toContain("# Introduction");
    expect(md).toContain("This is a paragraph.");
    expect(md).toContain("- Item one");
  });
});
