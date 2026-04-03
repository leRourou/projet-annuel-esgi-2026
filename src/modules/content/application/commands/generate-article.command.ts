import { randomUUID } from "crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { Article } from "../../domain/entities/article.entity";
import type { AiGeneratorPort } from "../../domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { ContentType } from "../../domain/value-objects/content-type.vo";
import { SeoMetadata } from "../../domain/value-objects/seo-metadata.vo";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";
import type { GenerateArticleInput } from "../dto/generate-article.dto";

export class GenerateArticleCommand {
  constructor(
    private readonly articleRepository: ArticleRepositoryPort,
    private readonly aiGenerator: AiGeneratorPort,
  ) {}

  async execute(input: GenerateArticleInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      const generated = await this.aiGenerator.generate({
        contentType: input.contentType,
        topic: input.topic,
        keywords: input.keywords,
        tone: input.tone,
        wordCount: input.wordCount,
        context: input.context,
      });

      const seoMetadata = SeoMetadata.create({
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        keywords: generated.suggestedKeywords,
        slug: generated.slug,
      });

      const article = Article.create(randomUUID(), {
        title: generated.title,
        body: generated.body,
        contentType: ContentType.create(input.contentType),
        seoMetadata,
        authorId: input.authorId,
        agencyId: input.agencyId,
      });

      await this.articleRepository.save(article);
      return Result.ok(toArticleDto(article));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
