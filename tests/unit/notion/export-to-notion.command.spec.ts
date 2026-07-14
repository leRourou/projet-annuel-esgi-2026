import type { TagRepositoryPort } from "@/modules/agency/domain/ports/tag.repository.port";
import { Article } from "@/modules/content/domain/entities/article.entity";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { ContentStatus } from "@/modules/content/domain/value-objects/content-status.vo";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { ExportToNotionCommand } from "@/modules/notion/application/commands/export-to-notion.command";
import { NotionPage } from "@/modules/notion/domain/entities/notion-page.entity";
import type { NotionClientPort } from "@/modules/notion/domain/ports/notion-client.port";
import { describe, expect, it, vi } from "vitest";

const ARTICLE_ID = "00000000-0000-0000-0000-000000000001";
const AGENCY_ID = "00000000-0000-0000-0000-000000000002";
const NOTION_PAGE_ID = "notion-page-abc";

function makeArticle(overrides: Partial<Parameters<typeof Article.reconstitute>[1]> = {}) {
  return Article.reconstitute(ARTICLE_ID, {
    title: "Guide SEO 2025",
    body: "# SEO\n\nContenu de test.",
    contentType: ContentType.create("ARTICLE"),
    status: ContentStatus.create("DRAFT"),
    seoMetadata: SeoMetadata.create({
      metaTitle: "SEO 2025",
      metaDescription: "Guide complet SEO",
      keywords: ["seo", "2025"],
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

function makeFakeNotionPage(): NotionPage {
  return NotionPage.create(NOTION_PAGE_ID, {
    title: "Guide SEO 2025",
    blocks: [],
    url: `https://notion.so/${NOTION_PAGE_ID}`,
    lastEditedAt: new Date(),
  });
}

function makeNotionClient(): NotionClientPort {
  return {
    searchPages: vi.fn(),
    getPage: vi.fn(),
    createPage: vi.fn(),
    updatePage: vi.fn(),
    exportPage: vi.fn().mockResolvedValue(makeFakeNotionPage()),
    searchDatabases: vi.fn(),
    getDatabase: vi.fn(),
    queryDatabase: vi.fn(),
    setPageStatus: vi.fn(),
    updatePageSchedule: vi.fn(),
    testConnection: vi.fn(),
  };
}

function makeArticleRepo(article: Article | null = makeArticle()): ArticleRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(article),
    save: vi.fn().mockResolvedValue(undefined),
    findAll: vi.fn(),
    findScheduled: vi.fn(),
    findPublishedBefore: vi.fn(),
    delete: vi.fn(),
  };
}

function makeTagRepo(): TagRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByAgencyId: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    delete: vi.fn(),
  };
}

const baseInput = {
  articleId: ARTICLE_ID,
  parentDatabaseId: "db-123",
  accessToken: "notion-token",
};

describe("ExportToNotionCommand", () => {
  it("exports article to Notion and saves the notionPageId", async () => {
    const notionClient = makeNotionClient();
    const articleRepo = makeArticleRepo();
    const tagRepo = makeTagRepo();
    const command = new ExportToNotionCommand(notionClient, articleRepo, tagRepo);

    const result = await command.execute(baseInput);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.notionPageId).toBe(NOTION_PAGE_ID);
    expect(notionClient.exportPage).toHaveBeenCalledOnce();
    expect(articleRepo.save).toHaveBeenCalledOnce();
  });

  it("passes status, contentType and tags to notionClient.exportPage", async () => {
    const notionClient = makeNotionClient();
    const article = makeArticle({ tagIds: ["tag-1"] });
    const articleRepo = makeArticleRepo(article);
    const tagRepo: TagRepositoryPort = {
      ...makeTagRepo(),
      findById: vi.fn().mockResolvedValue({ id: "tag-1", name: "SEO" }),
    };
    const command = new ExportToNotionCommand(notionClient, articleRepo, tagRepo);

    await command.execute(baseInput);

    expect(notionClient.exportPage).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "DRAFT",
        contentType: "ARTICLE",
        tags: ["SEO"],
      }),
    );
  });

  it("schedules publication date when scheduledAt is provided", async () => {
    const notionClient = makeNotionClient();
    const articleRepo = makeArticleRepo();
    const tagRepo = makeTagRepo();
    const command = new ExportToNotionCommand(notionClient, articleRepo, tagRepo);
    const scheduledAt = new Date("2025-08-01");

    await command.execute({ ...baseInput, scheduledAt });

    expect(notionClient.exportPage).toHaveBeenCalledWith(expect.objectContaining({ scheduledAt }));
    // article should have been saved twice: once for scheduledAt, once for notionPageId
    expect(articleRepo.save).toHaveBeenCalledTimes(2);
  });

  it("returns NotFoundError when article does not exist", async () => {
    const notionClient = makeNotionClient();
    const articleRepo = makeArticleRepo(null);
    const tagRepo = makeTagRepo();
    const command = new ExportToNotionCommand(notionClient, articleRepo, tagRepo);

    const result = await command.execute(baseInput);

    expect(result.success).toBe(false);
    expect(notionClient.exportPage).not.toHaveBeenCalled();
  });
});
