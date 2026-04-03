import { Feed } from "../../domain/entities/feed.entity";
import { FeedItem } from "../../domain/entities/feed-item.entity";
import { FeedUrl } from "../../domain/value-objects/feed-url.vo";
import type { FeedTypeormEntity } from "../entities/feed.typeorm-entity";
import type { FeedItemTypeormEntity } from "../entities/feed-item.typeorm-entity";

export class FeedMapper {
  static feedToDomain(entity: FeedTypeormEntity): Feed {
    return Feed.reconstitute(entity.id, {
      name: entity.name,
      url: FeedUrl.create(entity.url),
      ownerId: entity.ownerId,
      lastFetchedAt: entity.lastFetchedAt ?? undefined,
      createdAt: entity.createdAt,
    });
  }

  static feedToPersistence(feed: Feed): Partial<FeedTypeormEntity> {
    return {
      id: feed.id,
      name: feed.name,
      url: feed.url.value,
      ownerId: feed.ownerId,
      lastFetchedAt: feed.lastFetchedAt ?? null,
    };
  }

  static feedItemToDomain(entity: FeedItemTypeormEntity): FeedItem {
    return FeedItem.create(entity.id, {
      feedId: entity.feedId,
      title: entity.title,
      link: entity.link,
      summary: entity.summary,
      publishedAt: entity.publishedAt,
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
    };
  }
}
