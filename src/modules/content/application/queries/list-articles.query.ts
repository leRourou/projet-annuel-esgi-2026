import { z } from "zod";
import type { PaginatedResult } from "@/shared/domain/types/pagination.type";
import type { ArticleRepositoryPort, ArticleFilters } from "../../domain/ports/article.repository.port";
import { toArticleDto, type ArticleDto } from "../dto/article.dto";

export const ListArticlesInputSchema = z.object({
  authorId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type ListArticlesInput = z.infer<typeof ListArticlesInputSchema>;

export class ListArticlesQuery {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(input: ListArticlesInput): Promise<PaginatedResult<ArticleDto>> {
    const filters: ArticleFilters = {
      authorId: input.authorId,
      status: input.status,
    };
    const result = await this.articleRepository.findAll(filters, {
      page: input.page,
      limit: input.limit,
    });
    return {
      ...result,
      items: result.items.map(toArticleDto),
    };
  }
}
