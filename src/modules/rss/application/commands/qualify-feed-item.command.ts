import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import { CURATION_STATUSES, CurationStatus } from "../../domain/value-objects/curation-status.vo";

export const QualifyFeedItemInputSchema = z.object({
  itemId: z.string().min(1),
  status: z.enum(CURATION_STATUSES),
  tagIds: z.array(z.string()).optional(),
});

export type QualifyFeedItemInput = z.infer<typeof QualifyFeedItemInputSchema>;

export class QualifyFeedItemCommand {
  constructor(private readonly feedRepository: FeedRepositoryPort) {}

  async execute(input: QualifyFeedItemInput): Promise<Result<void, DomainError>> {
    const item = await this.feedRepository.findItemById(input.itemId);
    if (!item) {
      return Result.fail(new DomainError("Feed item not found", "FEED_ITEM_NOT_FOUND"));
    }

    item.qualify(CurationStatus.create(input.status));

    if (input.tagIds !== undefined) {
      item.assignTags(input.tagIds);
    }

    await this.feedRepository.saveFeedItem(item);
    return Result.ok(undefined);
  }
}
