import type { PaginatedResult, PaginationParams } from "@/shared/domain/types/pagination.type";
import type { Article } from "../entities/article.entity";
import type { ContentStatusValue } from "../value-objects/content-status.vo";

export interface ArticleFilters {
  agencyId: string;
  authorId?: string;
  status?: ContentStatusValue;
  tagId?: string;
}

export interface ArticleRepositoryPort {
  findById(id: string): Promise<Article | null>;
  findAll(filters: ArticleFilters, pagination: PaginationParams): Promise<PaginatedResult<Article>>;
  findScheduled(agencyId: string): Promise<Article[]>;
  save(article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}
