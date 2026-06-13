import { z } from "zod";
import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import { CURATION_STATUSES } from "../../domain/value-objects/curation-status.vo";
import { type FeedItemDto, toFeedItemDto } from "../dto/feed-item.dto";

export const ListCuratedItemsInputSchema = z.object({
  agencyId: z.string().min(1),
  curationStatus: z.enum(CURATION_STATUSES).optional(),
  tagId: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export type ListCuratedItemsInput = z.infer<typeof ListCuratedItemsInputSchema>;

export class ListCuratedItemsQuery {
  constructor(private readonly feedRepository: FeedRepositoryPort) {}

  async execute(input: ListCuratedItemsInput): Promise<FeedItemDto[]> {
    const items = await this.feedRepository.findItemsByAgency(input.agencyId, {
      curationStatus: input.curationStatus,
      tagId: input.tagId,
      limit: input.limit,
    });
    return items.map(toFeedItemDto);
  }
}
