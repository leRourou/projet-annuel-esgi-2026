import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import type { FeedItemDto } from "../dto/feed-item.dto";
import { toFeedItemDto } from "../dto/feed-item.dto";

export class GetSourceItemsQuery {
  constructor(private readonly feedRepository: FeedRepositoryPort) {}

  async execute(sourceIds: string[]): Promise<FeedItemDto[]> {
    if (sourceIds.length === 0) return [];
    const items = await this.feedRepository.findItemsByIds(sourceIds);
    return items.map(toFeedItemDto);
  }
}
