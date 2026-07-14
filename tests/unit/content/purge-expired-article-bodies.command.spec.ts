import { PurgeExpiredArticleBodiesCommand } from "@/modules/content/application/commands/purge-expired-article-bodies.command";
import { Article } from "@/modules/content/domain/entities/article.entity";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { ContentStatus } from "@/modules/content/domain/value-objects/content-status.vo";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { describe, expect, it, vi } from "vitest";

function makePublishedArticle(id: string, publishedDaysAgo: number): Article {
  const now = new Date();
  return Article.reconstitute(id, {
    title: `Article ${id}`,
    body: "Some long-form content.",
    contentType: ContentType.ARTICLE,
    status: ContentStatus.PUBLISHED,
    seoMetadata: SeoMetadata.create({
      metaTitle: "Title",
      metaDescription: "Description",
      keywords: ["kw"],
      slug: `slug-${id}`,
    }),
    authorId: "author-1",
    agencyId: "agency-1",
    tagIds: [],
    sourceIds: [],
    publishedAt: new Date(now.getTime() - publishedDaysAgo * 24 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });
}

function makeRepo(articles: Article[]): ArticleRepositoryPort {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    findScheduled: vi.fn(),
    findPublishedBefore: vi.fn().mockResolvedValue(articles),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  };
}

describe("PurgeExpiredArticleBodiesCommand", () => {
  it("purges the body of eligible articles and saves them", async () => {
    const eligible = makePublishedArticle("a-1", 31);
    const repo = makeRepo([eligible]);
    const command = new PurgeExpiredArticleBodiesCommand(repo);

    const result = await command.execute();

    expect(result.purged).toBe(1);
    expect(eligible.body).toBe("");
    expect(repo.save).toHaveBeenCalledWith(eligible);
  });

  it("skips articles that are not actually eligible and does not save them", async () => {
    const notEligible = makePublishedArticle("a-2", 10);
    const repo = makeRepo([notEligible]);
    const command = new PurgeExpiredArticleBodiesCommand(repo);

    const result = await command.execute();

    expect(result.purged).toBe(0);
    expect(notEligible.body).not.toBe("");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("continues purging remaining articles when one fails to save", async () => {
    const first = makePublishedArticle("a-3", 40);
    const second = makePublishedArticle("a-4", 35);
    const repo = makeRepo([first, second]);
    (repo.save as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("db error"));
    const command = new PurgeExpiredArticleBodiesCommand(repo);

    const result = await command.execute();

    expect(result.purged).toBe(1);
    expect(result.failed).toBe(1);
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it("returns zero when there are no candidates", async () => {
    const repo = makeRepo([]);
    const command = new PurgeExpiredArticleBodiesCommand(repo);

    const result = await command.execute();

    expect(result).toEqual({ purged: 0, failed: 0 });
  });
});
