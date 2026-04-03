import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";

export class GetArticleQuery {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(id: string): Promise<Result<ArticleDto, NotFoundError>> {
    const article = await this.articleRepository.findById(id);
    if (!article) {
      return Result.fail(new NotFoundError("Article", id));
    }
    return Result.ok(toArticleDto(article));
  }
}
