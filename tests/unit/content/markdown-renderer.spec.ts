import {
  markdownToHtml,
  markdownToPlainText,
} from "@/modules/content/domain/services/markdown-renderer";
import { describe, expect, it } from "vitest";

describe("markdownToHtml", () => {
  it("converts headings to h1-h4", () => {
    const html = markdownToHtml("# Title\n\n## Section\n\n### Sub\n\n#### Detail");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<h2>Section</h2>");
    expect(html).toContain("<h3>Sub</h3>");
    expect(html).toContain("<h4>Detail</h4>");
  });

  it("groups consecutive bullet items into a single ul", () => {
    const html = markdownToHtml("- one\n- two\n- three");
    expect(html).toBe("<ul>\n<li>one</li>\n<li>two</li>\n<li>three</li>\n</ul>");
  });

  it("groups consecutive numbered items into a single ol", () => {
    const html = markdownToHtml("1. one\n2. two");
    expect(html).toBe("<ol>\n<li>one</li>\n<li>two</li>\n</ol>");
  });

  it("wraps plain lines in paragraphs", () => {
    const html = markdownToHtml("Hello world");
    expect(html).toBe("<p>Hello world</p>");
  });

  it("converts bold, italic and links inline", () => {
    const html = markdownToHtml("**bold** and *italic* and [link](https://example.com)");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it("escapes HTML-sensitive characters", () => {
    const html = markdownToHtml("<script>alert(1)</script> & co");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });

  it("skips blank lines", () => {
    const html = markdownToHtml("# Title\n\n\nParagraph");
    expect(html).toBe("<h1>Title</h1>\n<p>Paragraph</p>");
  });
});

describe("markdownToPlainText", () => {
  it("strips heading markers", () => {
    expect(markdownToPlainText("# Title\n## Section")).toBe("Title\nSection");
  });

  it("strips bullet and numbered list markers", () => {
    expect(markdownToPlainText("- one\n- two\n1. three")).toBe("one\ntwo\nthree");
  });

  it("strips bold, italic and link markup keeping visible text", () => {
    expect(markdownToPlainText("**bold** *italic* [link](https://example.com)")).toBe(
      "bold italic link",
    );
  });

  it("collapses blank lines", () => {
    expect(markdownToPlainText("Line one\n\n\nLine two")).toBe("Line one\n\nLine two");
  });
});
