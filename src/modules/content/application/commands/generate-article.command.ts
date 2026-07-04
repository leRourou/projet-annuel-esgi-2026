import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { Article } from "../../domain/entities/article.entity";
import type {
  AiGeneratorPort,
  GenerateContentInput,
  GeneratedContent,
} from "../../domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { ContentType } from "../../domain/value-objects/content-type.vo";
import { SeoMetadata } from "../../domain/value-objects/seo-metadata.vo";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";
import type { GenerateArticleInput } from "../dto/generate-article.dto";
import { type ScoreContentSeoQuery, summarizeSeoIssues } from "../queries/score-content-seo.query";

const AUTO_CORRECT_THRESHOLD = 70;

export class GenerateArticleCommand {
  constructor(
    private readonly articleRepository: ArticleRepositoryPort,
    private readonly aiGenerator: AiGeneratorPort,
    private readonly scoreContentSeo: ScoreContentSeoQuery,
  ) {}

  private score(generated: GeneratedContent) {
    return this.scoreContentSeo.execute({
      title: generated.title,
      body: generated.body,
      seoMetadata: {
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        keywords: generated.suggestedKeywords,
        slug: generated.slug,
        excerpt: generated.excerpt,
      },
    });
  }

  async execute(input: GenerateArticleInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      const generateInput: GenerateContentInput = {
        contentType: input.contentType,
        topic: input.topic,
        keywords: input.keywords,
        tone: input.tone,
        wordCount: input.wordCount,
        articleType: input.articleType,
        context: input.context,
        language: input.language,
      };

      let generated = await this.aiGenerator.generate(generateInput);
      let score = this.score(generated);

      if (score.overall < AUTO_CORRECT_THRESHOLD) {
        const issues = summarizeSeoIssues(score);
        const corrected = await this.aiGenerator.generate({
          ...generateInput,
          context: [
            generateInput.context,
            `SEO FIX REQUIRED — the previous draft scored ${score.overall}/100. Address these issues:`,
            ...issues.map((issue) => `- ${issue}`),
          ]
            .filter(Boolean)
            .join("\n"),
        });
        const correctedScore = this.score(corrected);
        if (correctedScore.overall > score.overall) {
          generated = corrected;
          score = correctedScore;
        }
      }

      const seoMetadata = SeoMetadata.create({
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        keywords: generated.suggestedKeywords,
        slug: generated.slug,
        excerpt: generated.excerpt,
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
