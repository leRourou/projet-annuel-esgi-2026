import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { NotionClientPort } from "../../domain/ports/notion-client.port";

export const SyncPageToNotionInputSchema = z.object({
  articleId: z.string().uuid(),
  parentDatabaseId: z.string(),
  accessToken: z.string(),
});

export type SyncPageToNotionInput = z.infer<typeof SyncPageToNotionInputSchema>;

export class SyncPageToNotionCommand {
  constructor(
    private readonly notionClient: NotionClientPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {}

  async execute(
    input: SyncPageToNotionInput,
  ): Promise<Result<{ notionPageId: string }, DomainError>> {
    try {
      const article = await this.articleRepository.findById(input.articleId);
      if (!article) {
        return Result.fail(new NotFoundError("Article", input.articleId));
      }

      if (article.notionPageId) {
        await this.notionClient.updatePage(article.notionPageId, article.body, input.accessToken);
        return Result.ok({ notionPageId: article.notionPageId });
      }

      const page = await this.notionClient.createPage({
        parentDatabaseId: input.parentDatabaseId,
        title: article.title,
        content: article.body,
        accessToken: input.accessToken,
      });

      article.linkToNotion(page.id);
      await this.articleRepository.save(article);
      return Result.ok({ notionPageId: page.id });
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
