import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { SeoMetadata } from "../../domain/value-objects/seo-metadata.vo";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";

export const UpdateArticleInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  seoMetadata: z
    .object({
      metaTitle: z.string().max(70),
      metaDescription: z.string().max(160),
      keywords: z.array(z.string()),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    })
    .optional(),
  imagePrompt: z.string().optional(),
});

export type UpdateArticleInput = z.infer<typeof UpdateArticleInputSchema>;

export class UpdateArticleCommand {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(input: UpdateArticleInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      const article = await this.articleRepository.findById(input.id);
      if (!article) {
        return Result.fail(new NotFoundError("Article", input.id));
      }

      const seoMetadata = input.seoMetadata ? SeoMetadata.create(input.seoMetadata) : undefined;

      article.update({
        title: input.title,
        body: input.body,
        seoMetadata,
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
