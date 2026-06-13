import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { AiGeneratorPort } from "../../domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";

export const RegenerateSectionInputSchema = z.object({
  articleId: z.string().uuid(),
  instruction: z.string().min(1).max(500),
  context: z.string().optional(),
});

export type RegenerateSectionInput = z.infer<typeof RegenerateSectionInputSchema>;

export class RegenerateSectionCommand {
  constructor(
    private readonly aiGenerator: AiGeneratorPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {}

  async execute(input: RegenerateSectionInput): Promise<Result<string, DomainError>> {
    try {
      const article = await this.articleRepository.findById(input.articleId);
      if (!article) {
        return Result.fail(new NotFoundError("Article", input.articleId));
      }

      const regeneratedBody = await this.aiGenerator.regenerateSection({
        articleTitle: article.title,
        fullBody: article.body,
        instruction: input.instruction,
        context: input.context,
      });

      return Result.ok(regeneratedBody);
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
