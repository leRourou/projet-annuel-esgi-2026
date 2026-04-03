import { describe, it, expect } from "vitest";
import { FeedUrl } from "@/modules/rss/domain/value-objects/feed-url.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";

describe("FeedUrl", () => {
  it("creates a valid https URL", () => {
    const url = FeedUrl.create("https://feeds.example.com/rss");
    expect(url.value).toBe("https://feeds.example.com/rss");
  });

  it("throws for ftp protocol", () => {
    expect(() => FeedUrl.create("ftp://example.com/rss")).toThrow(DomainError);
  });

  it("throws for invalid URL", () => {
    expect(() => FeedUrl.create("not a url")).toThrow(DomainError);
  });

  it("equals() works correctly", () => {
    const a = FeedUrl.create("https://example.com/feed");
    const b = FeedUrl.create("https://example.com/feed");
    expect(a.equals(b)).toBe(true);
  });
});
