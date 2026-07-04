import type { Feed, FeedSourceType } from "../../domain/entities/feed.entity";

export interface FeedDto {
  id: string;
  name: string;
  url: string;
  ownerId: string;
  agencyId: string;
  lastFetchedAt: Date | null;
  createdAt: Date;
  sourceType: FeedSourceType;
}

export function toFeedDto(feed: Feed): FeedDto {
  return {
    id: feed.id,
    name: feed.name,
    url: feed.url.value,
    ownerId: feed.ownerId,
    agencyId: feed.agencyId,
    lastFetchedAt: feed.lastFetchedAt ?? null,
    createdAt: feed.createdAt,
    sourceType: feed.sourceType,
  };
}
