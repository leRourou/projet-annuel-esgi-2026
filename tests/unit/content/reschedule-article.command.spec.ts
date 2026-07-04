import { RescheduleArticleCommand } from "@/modules/content/application/commands/reschedule-article.command";
import { Article } from "@/modules/content/domain/entities/article.entity";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { describe, expect, it, vi } from "vitest";

const ARTICLE_ID = "00000000-0000-0000-0000-000000000001";
const AGENCY_ID = "00000000-0000-0000-0000-000000000002";

function makeArticle(): Article {
  return Article.create(ARTICLE_ID, {
    title: "Guide SEO 2025",
    body: "# SEO\n\nContenu de test.",
    contentType: ContentType.create("ARTICLE"),
    seoMetadata: SeoMetadata.create({
      metaTitle: "SEO 2025",
      metaDescription: "Guide complet SEO",
      keywords: ["seo"],
      slug: "guide-seo-2025",
    }),
    authorId: "author-1",
    agencyId: AGENCY_ID,
  });
}

function makeRepo(article: Article | null = makeArticle()): ArticleRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(article),
    findAll: vi.fn(),
    findScheduled: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  };
}

describe("RescheduleArticleCommand", () => {
  it("sets the scheduledAt date and saves the article", async () => {
    const article = makeArticle();
    const repo = makeRepo(article);
    const command = new RescheduleArticleCommand(repo);
    const scheduledAt = new Date("2026-08-15");

    const result = await command.execute({ articleId: ARTICLE_ID, scheduledAt });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.scheduledAt).toEqual(scheduledAt);
    }
    expect(article.scheduledAt).toEqual(scheduledAt);
    expect(repo.save).toHaveBeenCalledWith(article);
  });

  it("returns NotFoundError when the article does not exist", async () => {
    const repo = makeRepo(null);
    const command = new RescheduleArticleCommand(repo);

    const result = await command.execute({
      articleId: ARTICLE_ID,
      scheduledAt: new Date("2026-08-15"),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
    expect(repo.save).not.toHaveBeenCalled();
  });
});
