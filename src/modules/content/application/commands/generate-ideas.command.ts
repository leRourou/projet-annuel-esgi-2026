import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import type { AiGeneratorPort, ContentIdea } from "../../domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";

export interface GenerateIdeasInput {
  agencyId: string;
  themes: string[];
  agencyContext?: string;
  count?: number;
}

export class GenerateIdeasCommand {
  constructor(
    private readonly aiGenerator: AiGeneratorPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {}

  async execute(input: GenerateIdeasInput): Promise<Result<ContentIdea[], DomainError>> {
    try {
      const existing = await this.articleRepository.findAll(
        { agencyId: input.agencyId },
        { page: 1, limit: 200 },
      );
      const existingTitles = existing.items.map((a) => a.title);

      const ideas = await this.aiGenerator.generateIdeas({
        themes: input.themes,
        existingTitles,
        agencyContext: input.agencyContext,
        count: input.count,
      });

      return Result.ok(ideas);
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
