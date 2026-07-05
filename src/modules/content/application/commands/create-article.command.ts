import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import { Article } from "../../domain/entities/article.entity";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { CONTENT_TYPES, ContentType } from "../../domain/value-objects/content-type.vo";
import { SeoMetadata } from "../../domain/value-objects/seo-metadata.vo";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";

export const CreateArticleInputSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  metaTitle: z.string().max(70),
  metaDescription: z.string().max(160),
  slug: z.string().min(1),
  suggestedKeywords: z.array(z.string()),
  excerpt: z.string().max(300).optional(),
  contentType: z.enum(CONTENT_TYPES),
  imagePrompt: z.string().optional(),
  authorId: z.string().uuid(),
  agencyId: z.string().uuid(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

export class CreateArticleCommand {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(input: CreateArticleInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      const seoMetadata = SeoMetadata.create({
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        keywords: input.suggestedKeywords,
        slug: input.slug,
        excerpt: input.excerpt,
      });

      const article = Article.create(randomUUID(), {
        title: input.title,
        body: input.body,
        contentType: ContentType.create(input.contentType),
        seoMetadata,
        authorId: input.authorId,
        agencyId: input.agencyId,
        imagePrompt: input.imagePrompt,
      });

      await this.articleRepository.save(article);
      return Result.ok(toArticleDto(article));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
