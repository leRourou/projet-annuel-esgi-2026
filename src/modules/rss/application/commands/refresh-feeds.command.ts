import { createHash } from "node:crypto";
import { FeedItem } from "../../domain/entities/feed-item.entity";
import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import type { RssParserPort } from "../../domain/ports/rss-parser.port";

// RSS guids are only unique within a single feed, not across feeds. Two unrelated
// feeds can produce the same guid (e.g. sequential numeric ids), so the item's
// persisted id is namespaced by feedId to avoid the upsert in saveFeedItems
// silently overwriting an unrelated item from another feed/agency.
function buildFeedItemId(feedId: string, guid: string): string {
  return createHash("sha256").update(`${feedId}:${guid}`).digest("hex");
}

export class RefreshFeedsCommand {
  constructor(
    private readonly feedRepository: FeedRepositoryPort,
    private readonly rssParser: RssParserPort,
  ) {}

  async execute(): Promise<{ refreshed: number; failed: number }> {
    const feeds = await this.feedRepository.findAll();
    let refreshed = 0;
    let failed = 0;

    await Promise.allSettled(
      feeds.map(async (feed) => {
        if (feed.sourceType === "NOTION") return;
        try {
          const parsed = await this.rssParser.parse(feed.url.value);
          const items = parsed.items.map((item) =>
            FeedItem.create(buildFeedItemId(feed.id, item.guid), {
              feedId: feed.id,
              title: item.title,
              link: item.link,
              summary: item.summary,
              publishedAt: item.publishedAt,
            }),
          );
          await this.feedRepository.saveFeedItems(items);
          feed.markFetched();
          await this.feedRepository.saveFeed(feed);
          refreshed++;
        } catch {
          failed++;
        }
      }),
    );

    return { refreshed, failed };
  }
}
