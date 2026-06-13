import { QualifyFeedItemCommand } from "@/modules/rss/application/commands/qualify-feed-item.command";
import { FeedItem } from "@/modules/rss/domain/entities/feed-item.entity";
import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import { describe, expect, it, vi } from "vitest";

function makeItem(id = "item-1"): FeedItem {
  return FeedItem.create(id, {
    feedId: "feed-1",
    title: "Article title",
    link: "https://example.com/article",
    summary: "Summary",
    publishedAt: new Date("2024-01-01"),
  });
}

function makeRepo(item: FeedItem | null = makeItem()): FeedRepositoryPort {
  return {
    findById: vi.fn(),
    findAllByOwner: vi.fn(),
    findAllByAgency: vi.fn(),
    findAll: vi.fn(),
    saveFeed: vi.fn(),
    saveFeedItems: vi.fn(),
    saveFeedItem: vi.fn().mockResolvedValue(undefined),
    findItemsByFeedId: vi.fn(),
    findItemsByAgency: vi.fn(),
    findItemById: vi.fn().mockResolvedValue(item),
    deleteFeed: vi.fn(),
  };
}

describe("QualifyFeedItemCommand", () => {
  it("qualifies a feed item status", async () => {
    const item = makeItem();
    const repo = makeRepo(item);
    const command = new QualifyFeedItemCommand(repo);

    const result = await command.execute({ itemId: "item-1", status: "INTERESTING" });

    expect(result.success).toBe(true);
    expect(item.curationStatus.value).toBe("INTERESTING");
    expect(repo.saveFeedItem).toHaveBeenCalledWith(item);
  });

  it("assigns tags when provided", async () => {
    const item = makeItem();
    const repo = makeRepo(item);
    const command = new QualifyFeedItemCommand(repo);

    await command.execute({ itemId: "item-1", status: "TO_USE", tagIds: ["tag-1", "tag-2"] });

    expect(item.tagIds).toEqual(["tag-1", "tag-2"]);
  });

  it("does not change tags when tagIds is undefined", async () => {
    const item = makeItem();
    item.assignTags(["existing-tag"]);
    const repo = makeRepo(item);
    const command = new QualifyFeedItemCommand(repo);

    await command.execute({ itemId: "item-1", status: "IGNORED" });

    expect(item.tagIds).toEqual(["existing-tag"]);
  });

  it("fails when item not found", async () => {
    const repo = makeRepo(null);
    const command = new QualifyFeedItemCommand(repo);

    const result = await command.execute({ itemId: "missing", status: "UNREAD" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FEED_ITEM_NOT_FOUND");
    }
  });
});
