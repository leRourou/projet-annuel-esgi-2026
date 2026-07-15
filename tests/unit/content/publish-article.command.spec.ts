import { PublishArticleCommand } from "@/modules/content/application/commands/publish-article.command";
import { Article } from "@/modules/content/domain/entities/article.entity";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { ContentStatus } from "@/modules/content/domain/value-objects/content-status.vo";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { describe, expect, it, vi } from "vitest";

const ARTICLE_ID = "00000000-0000-0000-0000-000000000001";

function makeArticle(status: ContentStatus): Article {
  return Article.reconstitute(ARTICLE_ID, {
    title: "Guide SEO 2025",
    body: "# Guide SEO",
    contentType: ContentType.create("ARTICLE"),
    status,
    seoMetadata: SeoMetadata.create({
      metaTitle: "SEO 2025",
      metaDescription: "Guide complet SEO",
      keywords: ["seo"],
      slug: "guide-seo-2025",
    }),
    authorId: "author-1",
    agencyId: "agency-1",
    tagIds: [],
    sourceIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeRepository(article: Article): ArticleRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(article),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as ArticleRepositoryPort;
}

describe("PublishArticleCommand", () => {
  it("publishes an article stuck in REVIEW by bridging the VALIDATED gate", async () => {
    const article = makeArticle(ContentStatus.REVIEW);
    const repository = makeRepository(article);
    const command = new PublishArticleCommand(repository);

    const result = await command.execute(ARTICLE_ID);

    expect(result.success).toBe(true);
    expect(article.status.value).toBe("PUBLISHED");
    expect(repository.save).toHaveBeenCalledWith(article);
  });

  it("publishes an article already VALIDATED directly", async () => {
    const article = makeArticle(ContentStatus.VALIDATED);
    const repository = makeRepository(article);
    const command = new PublishArticleCommand(repository);

    const result = await command.execute(ARTICLE_ID);

    expect(result.success).toBe(true);
    expect(article.status.value).toBe("PUBLISHED");
  });

  it("fails to publish a DRAFT article", async () => {
    const article = makeArticle(ContentStatus.DRAFT);
    const repository = makeRepository(article);
    const command = new PublishArticleCommand(repository);

    const result = await command.execute(ARTICLE_ID);

    expect(result.success).toBe(false);
  });
});
