import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";

export const RescheduleArticleInputSchema = z.object({
  articleId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
});

export type RescheduleArticleInput = z.infer<typeof RescheduleArticleInputSchema>;

export class RescheduleArticleCommand {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(input: RescheduleArticleInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      const article = await this.articleRepository.findById(input.articleId);
      if (!article) {
        return Result.fail(new NotFoundError("Article", input.articleId));
      }

      article.schedulePublication(input.scheduledAt);
      await this.articleRepository.save(article);

      return Result.ok(toArticleDto(article));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
