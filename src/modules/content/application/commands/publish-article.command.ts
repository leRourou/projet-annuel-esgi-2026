import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import { ContentStatus } from "../../domain/value-objects/content-status.vo";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { toArticleDto, type ArticleDto } from "../dto/article.dto";

export class PublishArticleCommand {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(articleId: string): Promise<Result<ArticleDto, DomainError>> {
    try {
      const article = await this.articleRepository.findById(articleId);
      if (!article) {
        return Result.fail(new NotFoundError("Article", articleId));
      }
      article.transitionTo(ContentStatus.PUBLISHED);
      await this.articleRepository.save(article);
      return Result.ok(toArticleDto(article));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
