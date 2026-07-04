import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { NotionClientPort } from "../../domain/ports/notion-client.port";

export const SyncArticleScheduleToNotionInputSchema = z.object({
  articleId: z.string().uuid(),
  accessToken: z.string(),
});

export type SyncArticleScheduleToNotionInput = z.infer<
  typeof SyncArticleScheduleToNotionInputSchema
>;

export class SyncArticleScheduleToNotionCommand {
  constructor(
    private readonly notionClient: NotionClientPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {}

  async execute(input: SyncArticleScheduleToNotionInput): Promise<Result<void, DomainError>> {
    const article = await this.articleRepository.findById(input.articleId);
    if (!article) {
      return Result.fail(new DomainError("Article not found", "ARTICLE_NOT_FOUND"));
    }

    if (!article.notionPageId || !article.scheduledAt) {
      return Result.ok(undefined);
    }

    await this.notionClient.updatePageSchedule(
      article.notionPageId,
      article.scheduledAt,
      input.accessToken,
    );
    return Result.ok(undefined);
  }
}
