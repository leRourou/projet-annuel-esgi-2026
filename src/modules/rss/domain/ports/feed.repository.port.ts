import type { FeedItem } from "../entities/feed-item.entity";
import type { Feed } from "../entities/feed.entity";
import type { CurationStatusValue } from "../value-objects/curation-status.vo";

export interface FeedItemFilters {
  curationStatus?: CurationStatusValue;
  tagId?: string;
  limit?: number;
}

export interface FeedRepositoryPort {
  findById(id: string): Promise<Feed | null>;
  findAllByOwner(ownerId: string): Promise<Feed[]>;
  findAllByAgency(agencyId: string): Promise<Feed[]>;
  findAll(): Promise<Feed[]>;
  saveFeed(feed: Feed): Promise<void>;
  saveFeedItems(items: FeedItem[]): Promise<void>;
  saveFeedItem(item: FeedItem): Promise<void>;
  findItemsByFeedId(feedId: string, limit?: number): Promise<FeedItem[]>;
  findItemsByAgency(agencyId: string, filters?: FeedItemFilters): Promise<FeedItem[]>;
  findItemById(id: string): Promise<FeedItem | null>;
  deleteFeed(id: string): Promise<void>;
}
