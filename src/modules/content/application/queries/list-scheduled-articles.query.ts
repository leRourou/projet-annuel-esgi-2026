import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";

export class ListScheduledArticlesQuery {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(agencyId: string): Promise<ArticleDto[]> {
    const articles = await this.articleRepository.findScheduled(agencyId);
    return articles.map(toArticleDto);
  }
}
