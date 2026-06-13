import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import { type FeedDto, toFeedDto } from "../dto/feed.dto";

export class ListFeedsQuery {
  constructor(private readonly feedRepository: FeedRepositoryPort) {}

  async execute(agencyId: string): Promise<FeedDto[]> {
    const feeds = await this.feedRepository.findAllByAgency(agencyId);
    return feeds.map(toFeedDto);
  }
}
