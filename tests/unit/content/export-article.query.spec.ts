import { ExportArticleQuery } from "@/modules/content/application/queries/export-article.query";
import { Article } from "@/modules/content/domain/entities/article.entity";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { describe, expect, it, vi } from "vitest";

const ARTICLE_ID = "00000000-0000-0000-0000-000000000001";

function makeArticle(): Article {
  return Article.create(ARTICLE_ID, {
    title: "Guide SEO 2025",
    body: "# Guide SEO\n\n- one\n- two",
    contentType: ContentType.create("ARTICLE"),
    seoMetadata: SeoMetadata.create({
      metaTitle: "SEO 2025",
      metaDescription: "Guide complet SEO",
      keywords: ["seo"],
      slug: "guide-seo-2025",
    }),
    authorId: "author-1",
    agencyId: "agency-1",
  });
}

function makeRepo(article: Article | null = makeArticle()): ArticleRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(article),
    findAll: vi.fn(),
    findScheduled: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
}

describe("ExportArticleQuery", () => {
  it("exports the article body as markdown", async () => {
    const query = new ExportArticleQuery(makeRepo());

    const result = await query.execute(ARTICLE_ID, "MARKDOWN");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.mimeType).toBe("text/markdown");
      expect(result.value.filename).toBe("guide-seo-2025.md");
      expect(result.value.content).toBe("# Guide SEO\n\n- one\n- two");
    }
  });

  it("exports the article body converted to html", async () => {
    const query = new ExportArticleQuery(makeRepo());

    const result = await query.execute(ARTICLE_ID, "HTML");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.mimeType).toBe("text/html");
      expect(result.value.filename).toBe("guide-seo-2025.html");
      expect(result.value.content).toContain("<h1>Guide SEO</h1>");
      expect(result.value.content).toContain("<li>one</li>");
    }
  });

  it("exports the article body converted to plain text", async () => {
    const query = new ExportArticleQuery(makeRepo());

    const result = await query.execute(ARTICLE_ID, "TEXT");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.mimeType).toBe("text/plain");
      expect(result.value.filename).toBe("guide-seo-2025.txt");
      expect(result.value.content).toBe("Guide SEO\n\none\ntwo");
    }
  });

  it("returns NotFoundError when the article does not exist", async () => {
    const query = new ExportArticleQuery(makeRepo(null));

    const result = await query.execute(ARTICLE_ID, "MARKDOWN");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("returns a domain error for an invalid format", async () => {
    const query = new ExportArticleQuery(makeRepo());

    const result = await query.execute(ARTICLE_ID, "PDF");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_EXPORT_FORMAT");
    }
  });
});
