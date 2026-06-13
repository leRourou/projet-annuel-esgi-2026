import type { PaginatedResult } from "@/shared/domain/types/pagination.type";
import { z } from "zod";
import type {
  ArticleFilters,
  ArticleRepositoryPort,
} from "../../domain/ports/article.repository.port";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";

export const ListArticlesInputSchema = z.object({
  agencyId: z.string().uuid(),
  authorId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]).optional(),
  tagId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type ListArticlesInput = z.infer<typeof ListArticlesInputSchema>;

export class ListArticlesQuery {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(input: ListArticlesInput): Promise<PaginatedResult<ArticleDto>> {
    const filters: ArticleFilters = {
      agencyId: input.agencyId,
      authorId: input.authorId,
      status: input.status,
      tagId: input.tagId,
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
