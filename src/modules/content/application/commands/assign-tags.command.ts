import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";

export interface AssignTagsInput {
  articleId: string;
  tagIds: string[];
}

export class AssignTagsCommand {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(input: AssignTagsInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      const article = await this.articleRepository.findById(input.articleId);
      if (!article) {
        return Result.fail(new NotFoundError("Article", input.articleId));
      }

      article.setTags(input.tagIds);
      await this.articleRepository.save(article);
      return Result.ok(toArticleDto(article));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
