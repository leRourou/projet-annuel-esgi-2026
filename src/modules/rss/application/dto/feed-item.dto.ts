import { z } from "zod";
import type { FeedItem } from "../../domain/entities/feed-item.entity";
import { CURATION_STATUSES } from "../../domain/value-objects/curation-status.vo";

export const FeedItemDtoSchema = z.object({
  id: z.string(),
  feedId: z.string(),
  title: z.string(),
  link: z.string().url(),
  summary: z.string(),
  publishedAt: z.date(),
  curationStatus: z.enum(CURATION_STATUSES),
  tagIds: z.array(z.string()),
});

export type FeedItemDto = z.infer<typeof FeedItemDtoSchema>;

export function toFeedItemDto(item: FeedItem): FeedItemDto {
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
