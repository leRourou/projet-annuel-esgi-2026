import { FeedItem } from "../../domain/entities/feed-item.entity";
import { Feed } from "../../domain/entities/feed.entity";
import { CurationStatus } from "../../domain/value-objects/curation-status.vo";
import { FeedUrl } from "../../domain/value-objects/feed-url.vo";
import type { FeedItemTypeormEntity } from "../entities/feed-item.typeorm-entity";
import type { FeedTypeormEntity } from "../entities/feed.typeorm-entity";

export class FeedMapper {
  static feedToDomain(entity: FeedTypeormEntity): Feed {
    return Feed.reconstitute(entity.id, {
      name: entity.name,
      url: FeedUrl.create(entity.url),
      ownerId: entity.ownerId,
      agencyId: entity.agencyId ?? "",
      lastFetchedAt: entity.lastFetchedAt ?? undefined,
      createdAt: entity.createdAt,
      sourceType: entity.sourceType === "NOTION" ? "NOTION" : "RSS",
      notionDatabaseId: entity.notionDatabaseId,
    });
  }

  static feedToPersistence(feed: Feed): Partial<FeedTypeormEntity> {
    return {
      id: feed.id,
      name: feed.name,
      url: feed.url.value,
      ownerId: feed.ownerId,
      agencyId: feed.agencyId || null,
      lastFetchedAt: feed.lastFetchedAt ?? null,
      sourceType: feed.sourceType,
      notionDatabaseId: feed.notionDatabaseId ?? null,
    };
  }

  static feedItemToDomain(entity: FeedItemTypeormEntity): FeedItem {
    return FeedItem.create(entity.id, {
      feedId: entity.feedId,
      title: entity.title,
      link: entity.link,
      summary: entity.summary,
      publishedAt: entity.publishedAt,
      curationStatus: CurationStatus.create(entity.curationStatus ?? "UNREAD"),
      tagIds: entity.tagIds ?? [],
    });
  }

  static feedItemToPersistence(item: FeedItem): Partial<FeedItemTypeormEntity> {
    return {
      id: item.id,
      feedId: item.feedId,
      title: item.title,
      link: item.link,
      summary: item.summary,
      publishedAt: item.publishedAt,
      curationStatus: item.curationStatus.value,
      tagIds: item.tagIds,
    };
  }
}
