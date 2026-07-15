import { RefreshFeedsCommand } from "@/modules/rss/application/commands/refresh-feeds.command";
import { Feed } from "@/modules/rss/domain/entities/feed.entity";
import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import type { ParsedFeed, RssParserPort } from "@/modules/rss/domain/ports/rss-parser.port";
import { FeedUrl } from "@/modules/rss/domain/value-objects/feed-url.vo";
import { describe, expect, it, vi } from "vitest";

function makeFeed(id: string, url: string): Feed {
  return Feed.reconstitute(id, {
    name: `Feed ${id}`,
    url: FeedUrl.create(url),
    ownerId: "owner-1",
    agencyId: "agency-1",
    createdAt: new Date(),
    sourceType: "RSS",
  });
}

function makeFeedRepository(overrides: Partial<FeedRepositoryPort> = {}): FeedRepositoryPort {
  return {
    findById: vi.fn(),
    findAllByOwner: vi.fn(),
    findAllByAgency: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    saveFeed: vi.fn().mockResolvedValue(undefined),
    saveFeedItems: vi.fn().mockResolvedValue(undefined),
    saveFeedItem: vi.fn(),
    findItemsByFeedId: vi.fn(),
    findItemsByAgency: vi.fn(),
    findItemById: vi.fn(),
    findItemsByIds: vi.fn(),
    deleteFeed: vi.fn(),
    ...overrides,
  };
}

function makeParser(parsed: ParsedFeed): RssParserPort {
  return { parse: vi.fn().mockResolvedValue(parsed) };
}

function firstSavedItemId(repo: FeedRepositoryPort): string {
  const mock = repo.saveFeedItems as ReturnType<typeof vi.fn>;
  const items = mock.mock.calls[0]?.[0] as Array<{ id: string }> | undefined;
  const id = items?.[0]?.id;
  if (!id) throw new Error("saveFeedItems was not called with any items");
  return id;
}

describe("RefreshFeedsCommand", () => {
  it("namespaces feed item ids by feed so identical guids from different feeds don't collide", async () => {
    const feedA = makeFeed("feed-a", "https://a.example.com/rss");
    const feedB = makeFeed("feed-b", "https://b.example.com/rss");
    const feedRepository = makeFeedRepository({
      findAll: vi.fn().mockResolvedValue([feedA, feedB]),
    });
    // Two unrelated feeds both use the same guid "1" for their first item —
    // a common pattern with sequential/incremental guids.
    const sharedGuidItem = {
      guid: "1",
      title: "Item",
      link: "https://example.com/item",
      summary: "summary",
      publishedAt: new Date("2024-01-01"),
    };
    const parser: RssParserPort = {
      parse: vi.fn().mockResolvedValue({ title: "Feed", items: [sharedGuidItem] }),
    };
    const command = new RefreshFeedsCommand(feedRepository, parser);

    await command.execute();

    const savedCalls = (feedRepository.saveFeedItems as ReturnType<typeof vi.fn>).mock.calls;
    const savedIds = savedCalls.map(([items]) => items[0].id as string);

    expect(savedIds).toHaveLength(2);
    expect(savedIds[0]).not.toBe(savedIds[1]);
    expect(savedIds[0]).not.toBe("1");
  });

  it("produces the same item id across repeated refreshes of the same feed, enabling dedup via upsert", async () => {
    const feed = makeFeed("feed-a", "https://a.example.com/rss");
    const parsedFeed: ParsedFeed = {
      title: "Feed",
      items: [
        {
          guid: "42",
          title: "Item",
          link: "https://example.com/item",
          summary: "summary",
          publishedAt: new Date("2024-01-01"),
        },
      ],
    };

    const firstRunRepo = makeFeedRepository({ findAll: vi.fn().mockResolvedValue([feed]) });
    await new RefreshFeedsCommand(firstRunRepo, makeParser(parsedFeed)).execute();
    const firstId = firstSavedItemId(firstRunRepo);

    const secondRunRepo = makeFeedRepository({ findAll: vi.fn().mockResolvedValue([feed]) });
    await new RefreshFeedsCommand(secondRunRepo, makeParser(parsedFeed)).execute();
    const secondId = firstSavedItemId(secondRunRepo);

    expect(firstId).toBe(secondId);
  });

  it("skips Notion-sourced feeds", async () => {
    const notionFeed = Feed.reconstitute("feed-notion", {
      name: "Notion feed",
      url: FeedUrl.create("https://notion.so/db"),
      ownerId: "owner-1",
      agencyId: "agency-1",
      createdAt: new Date(),
      sourceType: "NOTION",
    });
    const feedRepository = makeFeedRepository({
      findAll: vi.fn().mockResolvedValue([notionFeed]),
    });
    const parser = makeParser({ title: "Feed", items: [] });
    const command = new RefreshFeedsCommand(feedRepository, parser);

    const result = await command.execute();

    expect(parser.parse).not.toHaveBeenCalled();
    expect(result).toEqual({ refreshed: 0, failed: 0 });
  });
});
