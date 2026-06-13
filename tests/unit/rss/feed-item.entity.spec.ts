import { FeedItem } from "@/modules/rss/domain/entities/feed-item.entity";
import { CurationStatus } from "@/modules/rss/domain/value-objects/curation-status.vo";
import { describe, expect, it } from "vitest";

const baseProps = {
  feedId: "feed-1",
  title: "Test article",
  link: "https://example.com/article",
  summary: "A summary",
  publishedAt: new Date("2024-01-01"),
};

describe("FeedItem", () => {
  it("defaults curation status to UNREAD", () => {
    const item = FeedItem.create("id-1", baseProps);
    expect(item.curationStatus.value).toBe("UNREAD");
  });

  it("defaults tagIds to empty array", () => {
    const item = FeedItem.create("id-1", baseProps);
    expect(item.tagIds).toEqual([]);
  });

  it("qualifies to INTERESTING", () => {
    const item = FeedItem.create("id-1", baseProps);
    item.qualify(CurationStatus.create("INTERESTING"));
    expect(item.curationStatus.value).toBe("INTERESTING");
  });

  it("qualifies to TO_USE", () => {
    const item = FeedItem.create("id-1", baseProps);
    item.qualify(CurationStatus.create("TO_USE"));
    expect(item.curationStatus.value).toBe("TO_USE");
  });

  it("assigns tags", () => {
    const item = FeedItem.create("id-1", baseProps);
    item.assignTags(["tag-1", "tag-2"]);
    expect(item.tagIds).toEqual(["tag-1", "tag-2"]);
  });

  it("replaces tags on reassign", () => {
    const item = FeedItem.create("id-1", baseProps);
    item.assignTags(["tag-1", "tag-2"]);
    item.assignTags(["tag-3"]);
    expect(item.tagIds).toEqual(["tag-3"]);
  });

  it("creates with explicit curationStatus", () => {
    const item = FeedItem.create("id-1", {
      ...baseProps,
      curationStatus: CurationStatus.create("IGNORED"),
    });
    expect(item.curationStatus.value).toBe("IGNORED");
  });
});
