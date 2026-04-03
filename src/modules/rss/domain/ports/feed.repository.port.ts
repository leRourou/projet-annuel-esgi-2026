import type { FeedItem } from "../entities/feed-item.entity";
import type { Feed } from "../entities/feed.entity";

export interface FeedRepositoryPort {
  findById(id: string): Promise<Feed | null>;
  findAllByOwner(ownerId: string): Promise<Feed[]>;
  findAllByAgency(agencyId: string): Promise<Feed[]>;
  findAll(): Promise<Feed[]>;
  saveFeed(feed: Feed): Promise<void>;
  saveFeedItems(items: FeedItem[]): Promise<void>;
  findItemsByFeedId(feedId: string, limit?: number): Promise<FeedItem[]>;
  deleteFeed(id: string): Promise<void>;
}
