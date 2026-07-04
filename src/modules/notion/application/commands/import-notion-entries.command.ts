import { randomUUID } from "node:crypto";
import { FeedItem } from "@/modules/rss/domain/entities/feed-item.entity";
import { Feed } from "@/modules/rss/domain/entities/feed.entity";
import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import { FeedUrl } from "@/modules/rss/domain/value-objects/feed-url.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { NotionClientPort } from "../../domain/ports/notion-client.port";

export const ImportNotionEntriesInputSchema = z.object({
  agencyId: z.string().uuid(),
  ownerId: z.string().uuid(),
  accessToken: z.string(),
  databaseId: z.string(),
});

export type ImportNotionEntriesInput = z.infer<typeof ImportNotionEntriesInputSchema>;

export interface ImportNotionEntriesResult {
  feedId: string;
  imported: number;
  skipped: number;
}

export class ImportNotionEntriesCommand {
  constructor(
    private readonly notionClient: NotionClientPort,
    private readonly feedRepository: FeedRepositoryPort,
  ) {}

  async execute(
    input: ImportNotionEntriesInput,
  ): Promise<Result<ImportNotionEntriesResult, DomainError>> {
    try {
      const feed = await this.findOrCreateFeed(input);

      const entries = await this.notionClient.queryDatabase({
        databaseId: input.databaseId,
        accessToken: input.accessToken,
      });

      const existingItems = await this.feedRepository.findItemsByFeedId(feed.id, 1000);
      const knownIds = new Set(existingItems.map((item) => item.id));
      const newEntries = entries.filter((entry) => !knownIds.has(entry.id));

      const newItems = await Promise.all(
        newEntries.map(async (entry) => {
          const page = await this.notionClient.getPage(entry.id, input.accessToken);
          return FeedItem.create(entry.id, {
            feedId: feed.id,
            title: entry.title,
            link: entry.url,
            summary: page.toMarkdown().slice(0, 2000),
            publishedAt: entry.lastEditedAt,
          });
        }),
      );

      if (newItems.length > 0) {
        await this.feedRepository.saveFeedItems(newItems);
      }

      feed.markFetched();
      await this.feedRepository.saveFeed(feed);

      return Result.ok({
        feedId: feed.id,
        imported: newItems.length,
        skipped: entries.length - newItems.length,
      });
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }

  private async findOrCreateFeed(input: ImportNotionEntriesInput): Promise<Feed> {
    const feeds = await this.feedRepository.findAllByAgency(input.agencyId);
    const existing = feeds.find(
      (feed) => feed.sourceType === "NOTION" && feed.notionDatabaseId === input.databaseId,
    );
    if (existing) return existing;

    const database = await this.notionClient.getDatabase(input.databaseId, input.accessToken);
    const feed = Feed.create(randomUUID(), {
      name: `Notion: ${database.title}`,
      url: FeedUrl.create(database.url),
      ownerId: input.ownerId,
      agencyId: input.agencyId,
      sourceType: "NOTION",
      notionDatabaseId: input.databaseId,
    });
    await this.feedRepository.saveFeed(feed);
    return feed;
  }
}
