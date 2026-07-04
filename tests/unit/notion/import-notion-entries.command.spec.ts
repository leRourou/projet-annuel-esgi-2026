import { ImportNotionEntriesCommand } from "@/modules/notion/application/commands/import-notion-entries.command";
import { NotionPage } from "@/modules/notion/domain/entities/notion-page.entity";
import type { NotionClientPort } from "@/modules/notion/domain/ports/notion-client.port";
import { FeedItem } from "@/modules/rss/domain/entities/feed-item.entity";
import { Feed } from "@/modules/rss/domain/entities/feed.entity";
import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import { CurationStatus } from "@/modules/rss/domain/value-objects/curation-status.vo";
import { FeedUrl } from "@/modules/rss/domain/value-objects/feed-url.vo";
import { describe, expect, it, vi } from "vitest";

function makeNotionFeed(overrides: { id?: string } = {}) {
  return Feed.reconstitute(overrides.id ?? "feed-1", {
    name: "Notion: Veille",
    url: FeedUrl.create("https://notion.so/db-abc"),
    ownerId: OWNER_ID,
    agencyId: AGENCY_ID,
    createdAt: new Date(),
    sourceType: "NOTION",
    notionDatabaseId: DATABASE_ID,
  });
}

const AGENCY_ID = "00000000-0000-0000-0000-000000000001";
const OWNER_ID = "00000000-0000-0000-0000-000000000002";
const DATABASE_ID = "db-abc";

function makeNotionClient(overrides: Partial<NotionClientPort> = {}): NotionClientPort {
  return {
    searchPages: vi.fn(),
    getPage: vi.fn().mockImplementation((id: string) =>
      Promise.resolve(
        NotionPage.create(id, {
          title: "Page title",
          blocks: [],
          url: `https://notion.so/${id}`,
          lastEditedAt: new Date("2024-01-02"),
        }),
      ),
    ),
    createPage: vi.fn(),
    updatePage: vi.fn(),
    exportPage: vi.fn(),
    searchDatabases: vi.fn(),
    getDatabase: vi.fn().mockResolvedValue({
      id: DATABASE_ID,
      title: "Veille concurrence",
      url: "https://notion.so/db-abc",
    }),
    queryDatabase: vi.fn().mockResolvedValue([]),
    setPageStatus: vi.fn(),
    updatePageSchedule: vi.fn(),
    testConnection: vi.fn(),
    ...overrides,
  };
}

function makeFeedRepository(overrides: Partial<FeedRepositoryPort> = {}): FeedRepositoryPort {
  return {
    findById: vi.fn(),
    findAllByOwner: vi.fn(),
    findAllByAgency: vi.fn().mockResolvedValue([]),
    findAll: vi.fn(),
    saveFeed: vi.fn().mockResolvedValue(undefined),
    saveFeedItems: vi.fn().mockResolvedValue(undefined),
    saveFeedItem: vi.fn(),
    findItemsByFeedId: vi.fn().mockResolvedValue([]),
    findItemsByAgency: vi.fn(),
    findItemById: vi.fn(),
    findItemsByIds: vi.fn(),
    deleteFeed: vi.fn(),
    ...overrides,
  };
}

const baseInput = {
  agencyId: AGENCY_ID,
  ownerId: OWNER_ID,
  accessToken: "notion-token",
  databaseId: DATABASE_ID,
};

describe("ImportNotionEntriesCommand", () => {
  it("creates a Notion feed on first sync and imports all entries as new FeedItems", async () => {
    const notionClient = makeNotionClient({
      queryDatabase: vi.fn().mockResolvedValue([
        {
          id: "page-1",
          title: "Article 1",
          url: "https://notion.so/page-1",
          lastEditedAt: new Date(),
        },
        {
          id: "page-2",
          title: "Article 2",
          url: "https://notion.so/page-2",
          lastEditedAt: new Date(),
        },
      ]),
    });
    const feedRepository = makeFeedRepository();
    const command = new ImportNotionEntriesCommand(notionClient, feedRepository);

    const result = await command.execute(baseInput);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.imported).toBe(2);
    expect(result.value.skipped).toBe(0);
    expect(feedRepository.saveFeed).toHaveBeenCalled();
    expect(feedRepository.saveFeedItems).toHaveBeenCalledWith([
      expect.objectContaining({ id: "page-1" }),
      expect.objectContaining({ id: "page-2" }),
    ]);
  });

  it("reuses an existing Notion feed for the same database instead of creating a new one", async () => {
    const existingFeed = makeNotionFeed();
    const notionClient = makeNotionClient({ queryDatabase: vi.fn().mockResolvedValue([]) });
    const feedRepository = makeFeedRepository({
      findAllByAgency: vi.fn().mockResolvedValue([existingFeed]),
    });
    const command = new ImportNotionEntriesCommand(notionClient, feedRepository);

    await command.execute(baseInput);

    expect(notionClient.getDatabase).not.toHaveBeenCalled();
    expect(feedRepository.findItemsByFeedId).toHaveBeenCalledWith("feed-1", 1000);
  });

  it("only imports entries not already known, preserving curation of existing items", async () => {
    const existingFeed = makeNotionFeed();
    const alreadyKnownItem = FeedItem.create("page-1", {
      feedId: "feed-1",
      title: "Article 1",
      link: "https://notion.so/page-1",
      summary: "old",
      publishedAt: new Date("2023-01-01"),
    });
    alreadyKnownItem.qualify(CurationStatus.create("TO_USE"));

    const notionClient = makeNotionClient({
      queryDatabase: vi.fn().mockResolvedValue([
        {
          id: "page-1",
          title: "Article 1",
          url: "https://notion.so/page-1",
          lastEditedAt: new Date(),
        },
        {
          id: "page-2",
          title: "Article 2",
          url: "https://notion.so/page-2",
          lastEditedAt: new Date(),
        },
      ]),
    });
    const feedRepository = makeFeedRepository({
      findAllByAgency: vi.fn().mockResolvedValue([existingFeed]),
      findItemsByFeedId: vi.fn().mockResolvedValue([alreadyKnownItem]),
    });
    const command = new ImportNotionEntriesCommand(notionClient, feedRepository);

    const result = await command.execute(baseInput);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.imported).toBe(1);
    expect(result.value.skipped).toBe(1);
    expect(feedRepository.saveFeedItems).toHaveBeenCalledWith([
      expect.objectContaining({ id: "page-2" }),
    ]);
  });
});
