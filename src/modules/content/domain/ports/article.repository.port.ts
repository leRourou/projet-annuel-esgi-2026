import type { PaginatedResult, PaginationParams } from "@/shared/domain/types/pagination.type";
import type { Article } from "../entities/article.entity";
import type { ContentStatusValue } from "../value-objects/content-status.vo";

export interface ArticleFilters {
  authorId?: string;
  status?: ContentStatusValue;
}

export interface ArticleRepositoryPort {
  findById(id: string): Promise<Article | null>;
  findAll(filters: ArticleFilters, pagination: PaginationParams): Promise<PaginatedResult<Article>>;
  save(article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}
