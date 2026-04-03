import { z } from "zod";
import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import { toFeedItemDto, type FeedItemDto } from "../dto/feed-item.dto";

export const ListFeedItemsInputSchema = z.object({
  feedId: z.string(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListFeedItemsInput = z.infer<typeof ListFeedItemsInputSchema>;

export class ListFeedItemsQuery {
  constructor(private readonly feedRepository: FeedRepositoryPort) {}

  async execute(input: ListFeedItemsInput): Promise<FeedItemDto[]> {
    const items = await this.feedRepository.findItemsByFeedId(input.feedId, input.limit);
    return items.map(toFeedItemDto);
  }
}
