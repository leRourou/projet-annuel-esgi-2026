import { SyncFeedItemStatusToNotionCommand } from "@/modules/notion/application/commands/sync-feed-item-status-to-notion.command";
import type { NotionClientPort } from "@/modules/notion/domain/ports/notion-client.port";
import { FeedItem } from "@/modules/rss/domain/entities/feed-item.entity";
import { Feed } from "@/modules/rss/domain/entities/feed.entity";
import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import { CurationStatus } from "@/modules/rss/domain/value-objects/curation-status.vo";
import { FeedUrl } from "@/modules/rss/domain/value-objects/feed-url.vo";
import { describe, expect, it, vi } from "vitest";

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
    setPageStatus: vi.fn().mockResolvedValue(undefined),
    updatePageSchedule: vi.fn(),
    testConnection: vi.fn(),
  };
}

function makeFeedRepository(overrides: Partial<FeedRepositoryPort> = {}): FeedRepositoryPort {
  return {
    findById: vi.fn(),
    findAllByOwner: vi.fn(),
    findAllByAgency: vi.fn(),
    findAll: vi.fn(),
    saveFeed: vi.fn(),
    saveFeedItems: vi.fn(),
    saveFeedItem: vi.fn(),
    findItemsByFeedId: vi.fn(),
    findItemsByAgency: vi.fn(),
    findItemById: vi.fn(),
    findItemsByIds: vi.fn(),
    deleteFeed: vi.fn(),
    ...overrides,
  };
}

const item = FeedItem.create("page-1", {
  feedId: "feed-1",
  title: "Article",
  link: "https://notion.so/page-1",
  summary: "summary",
  publishedAt: new Date("2024-01-01"),
});
item.qualify(CurationStatus.create("TO_USE"));

const notionFeed = Feed.reconstitute("feed-1", {
  name: "Notion: Veille",
  url: FeedUrl.create("https://notion.so/db-abc"),
  ownerId: "owner-1",
  agencyId: "agency-1",
  createdAt: new Date(),
  sourceType: "NOTION",
  notionDatabaseId: "db-abc",
});

const rssFeed = Feed.reconstitute("feed-2", {
  name: "Some blog",
  url: FeedUrl.create("https://example.com/feed.xml"),
  ownerId: "owner-1",
  agencyId: "agency-1",
  createdAt: new Date(),
  sourceType: "RSS",
});

describe("SyncFeedItemStatusToNotionCommand", () => {
  it("pushes the curation status to the Notion page when the item's feed is Notion-sourced", async () => {
    const notionClient = makeNotionClient();
    const feedRepository = makeFeedRepository({
      findItemById: vi.fn().mockResolvedValue(item),
      findById: vi.fn().mockResolvedValue(notionFeed),
    });
    const command = new SyncFeedItemStatusToNotionCommand(notionClient, feedRepository);

    const result = await command.execute({ itemId: "page-1", accessToken: "token" });

    expect(result.success).toBe(true);
    expect(notionClient.setPageStatus).toHaveBeenCalledWith("page-1", "TO_USE", "token");
  });

  it("does nothing when the item's feed is not Notion-sourced", async () => {
    const notionClient = makeNotionClient();
    const feedRepository = makeFeedRepository({
      findItemById: vi.fn().mockResolvedValue(item),
      findById: vi.fn().mockResolvedValue(rssFeed),
    });
    const command = new SyncFeedItemStatusToNotionCommand(notionClient, feedRepository);

    const result = await command.execute({ itemId: "page-1", accessToken: "token" });

    expect(result.success).toBe(true);
    expect(notionClient.setPageStatus).not.toHaveBeenCalled();
  });

  it("fails when the feed item does not exist", async () => {
    const notionClient = makeNotionClient();
    const feedRepository = makeFeedRepository({ findItemById: vi.fn().mockResolvedValue(null) });
    const command = new SyncFeedItemStatusToNotionCommand(notionClient, feedRepository);

    const result = await command.execute({ itemId: "missing", accessToken: "token" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FEED_ITEM_NOT_FOUND");
    }
  });
});
