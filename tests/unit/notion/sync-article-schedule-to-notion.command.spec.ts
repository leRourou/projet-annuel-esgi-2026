import { Article } from "@/modules/content/domain/entities/article.entity";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { ContentStatus } from "@/modules/content/domain/value-objects/content-status.vo";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { SyncArticleScheduleToNotionCommand } from "@/modules/notion/application/commands/sync-article-schedule-to-notion.command";
import type { NotionClientPort } from "@/modules/notion/domain/ports/notion-client.port";
import { describe, expect, it, vi } from "vitest";

const ARTICLE_ID = "00000000-0000-0000-0000-000000000001";
const AGENCY_ID = "00000000-0000-0000-0000-000000000002";

function makeArticle(overrides: Partial<Parameters<typeof Article.reconstitute>[1]> = {}) {
  return Article.reconstitute(ARTICLE_ID, {
    title: "Guide SEO 2025",
    body: "# SEO\n\nContenu de test.",
    contentType: ContentType.create("ARTICLE"),
    status: ContentStatus.create("DRAFT"),
    seoMetadata: SeoMetadata.create({
      metaTitle: "SEO 2025",
      metaDescription: "Guide complet SEO",
      keywords: ["seo"],
      slug: "guide-seo-2025",
    }),
    authorId: "author-1",
    agencyId: AGENCY_ID,
    tagIds: [],
    sourceIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeNotionClient(): NotionClientPort {
  return {
    searchPages: vi.fn(),
    getPage: vi.fn(),
    createPage: vi.fn(),
    updatePage: vi.fn(),
    exportPage: vi.fn(),
    searchDatabases: vi.fn(),
    getDatabase: vi.fn(),
    queryDatabase: vi.fn(),
    setPageStatus: vi.fn(),
    updatePageSchedule: vi.fn().mockResolvedValue(undefined),
    testConnection: vi.fn(),
  };
}

function makeArticleRepo(article: Article | null): ArticleRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(article),
    findAll: vi.fn(),
    findScheduled: vi.fn(),
    findPublishedBefore: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
}

describe("SyncArticleScheduleToNotionCommand", () => {
  it("pushes the scheduled date to the linked Notion page", async () => {
    const article = makeArticle({
      notionPageId: "notion-page-1",
      scheduledAt: new Date("2026-09-01"),
    });
    const notionClient = makeNotionClient();
    const command = new SyncArticleScheduleToNotionCommand(notionClient, makeArticleRepo(article));

    const result = await command.execute({ articleId: ARTICLE_ID, accessToken: "token" });

    expect(result.success).toBe(true);
    expect(notionClient.updatePageSchedule).toHaveBeenCalledWith(
      "notion-page-1",
      article.scheduledAt,
      "token",
    );
  });

  it("does nothing when the article has no linked Notion page", async () => {
    const article = makeArticle({ scheduledAt: new Date("2026-09-01") });
    const notionClient = makeNotionClient();
    const command = new SyncArticleScheduleToNotionCommand(notionClient, makeArticleRepo(article));

    const result = await command.execute({ articleId: ARTICLE_ID, accessToken: "token" });

    expect(result.success).toBe(true);
    expect(notionClient.updatePageSchedule).not.toHaveBeenCalled();
  });

  it("does nothing when the article has no scheduled date", async () => {
    const article = makeArticle({ notionPageId: "notion-page-1" });
    const notionClient = makeNotionClient();
    const command = new SyncArticleScheduleToNotionCommand(notionClient, makeArticleRepo(article));

    const result = await command.execute({ articleId: ARTICLE_ID, accessToken: "token" });

    expect(result.success).toBe(true);
    expect(notionClient.updatePageSchedule).not.toHaveBeenCalled();
  });

  it("fails when the article does not exist", async () => {
    const notionClient = makeNotionClient();
    const command = new SyncArticleScheduleToNotionCommand(notionClient, makeArticleRepo(null));

    const result = await command.execute({ articleId: ARTICLE_ID, accessToken: "token" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("ARTICLE_NOT_FOUND");
    }
  });
});
