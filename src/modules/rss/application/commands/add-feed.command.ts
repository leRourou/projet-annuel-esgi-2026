import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import { Feed } from "../../domain/entities/feed.entity";
import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import { FeedUrl } from "../../domain/value-objects/feed-url.vo";

export const AddFeedInputSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  ownerId: z.string().uuid(),
  agencyId: z.string().uuid(),
});

export type AddFeedInput = z.infer<typeof AddFeedInputSchema>;

export interface FeedDto {
  id: string;
  name: string;
  url: string;
  ownerId: string;
  createdAt: Date;
}

export class AddFeedCommand {
  constructor(private readonly feedRepository: FeedRepositoryPort) {}

  async execute(input: AddFeedInput): Promise<Result<FeedDto, DomainError>> {
    try {
      const feedUrl = FeedUrl.create(input.url);
      const feed = Feed.create(randomUUID(), {
        name: input.name,
        url: feedUrl,
        ownerId: input.ownerId,
        agencyId: input.agencyId,
      });
      await this.feedRepository.saveFeed(feed);
      return Result.ok({
        id: feed.id,
        name: feed.name,
        url: feed.url.value,
        ownerId: feed.ownerId,
        createdAt: feed.createdAt,
      });
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
