import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { NotionClientPort } from "../../domain/ports/notion-client.port";

export const SyncFeedItemStatusToNotionInputSchema = z.object({
  itemId: z.string().min(1),
  accessToken: z.string(),
});

export type SyncFeedItemStatusToNotionInput = z.infer<typeof SyncFeedItemStatusToNotionInputSchema>;

export class SyncFeedItemStatusToNotionCommand {
  constructor(
    private readonly notionClient: NotionClientPort,
    private readonly feedRepository: FeedRepositoryPort,
  ) {}

  async execute(input: SyncFeedItemStatusToNotionInput): Promise<Result<void, DomainError>> {
    const item = await this.feedRepository.findItemById(input.itemId);
    if (!item) {
      return Result.fail(new DomainError("Feed item not found", "FEED_ITEM_NOT_FOUND"));
    }

    const feed = await this.feedRepository.findById(item.feedId);
    if (!feed || feed.sourceType !== "NOTION") {
      return Result.ok(undefined);
    }

    await this.notionClient.setPageStatus(item.id, item.curationStatus.value, input.accessToken);
    return Result.ok(undefined);
  }
}
