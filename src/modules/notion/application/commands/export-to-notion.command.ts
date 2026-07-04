import type { TagRepositoryPort } from "@/modules/agency/domain/ports/tag.repository.port";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { NotionClientPort } from "../../domain/ports/notion-client.port";

export const ExportToNotionInputSchema = z.object({
  articleId: z.string().uuid(),
  parentDatabaseId: z.string().min(1),
  accessToken: z.string().min(1),
  scheduledAt: z.coerce.date().optional(),
});

export type ExportToNotionInput = z.infer<typeof ExportToNotionInputSchema>;

export class ExportToNotionCommand {
  constructor(
    private readonly notionClient: NotionClientPort,
    private readonly articleRepository: ArticleRepositoryPort,
    private readonly tagRepository: TagRepositoryPort,
  ) {}

  async execute(
    input: ExportToNotionInput,
  ): Promise<Result<{ notionPageId: string }, DomainError>> {
    try {
      const article = await this.articleRepository.findById(input.articleId);
      if (!article) {
        return Result.fail(new NotFoundError("Article", input.articleId));
      }

      const tags =
        article.tagIds.length > 0
          ? await Promise.all(article.tagIds.map((id) => this.tagRepository.findById(id)))
          : [];
      const tagNames = tags.flatMap((t) => (t ? [t.name] : []));

      if (input.scheduledAt) {
        article.schedulePublication(input.scheduledAt);
        await this.articleRepository.save(article);
      }

      const page = await this.notionClient.exportPage({
        parentDatabaseId: input.parentDatabaseId,
        title: article.title,
        body: article.body,
        accessToken: input.accessToken,
        status: article.status.value,
        contentType: article.contentType.value,
        tags: tagNames,
        scheduledAt: input.scheduledAt,
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
