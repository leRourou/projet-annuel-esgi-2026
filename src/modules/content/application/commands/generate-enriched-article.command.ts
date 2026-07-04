import { randomUUID } from "node:crypto";
import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import { Article } from "../../domain/entities/article.entity";
import type {
  AiGeneratorPort,
  CuratedSource,
  GeneratedContent,
} from "../../domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { ContentType } from "../../domain/value-objects/content-type.vo";
import { LANGUAGES } from "../../domain/value-objects/language.vo";
import { SeoMetadata } from "../../domain/value-objects/seo-metadata.vo";
import { type ArticleDto, toArticleDto } from "../dto/article.dto";
import { type ScoreContentSeoQuery, summarizeSeoIssues } from "../queries/score-content-seo.query";

const AUTO_CORRECT_THRESHOLD = 70;

export const GenerateEnrichedArticleInputSchema = z.object({
  topic: z.string().min(3),
  keywords: z.array(z.string().min(1)).min(1),
  contentType: z.enum(["ARTICLE", "PRODUCT_SHEET", "META", "LINKEDIN_POST", "FACEBOOK_POST"]),
  tone: z.string().optional(),
  wordCount: z.number().int().min(100).max(5000).optional(),
  context: z.string().optional(),
  language: z.enum(LANGUAGES).optional(),
  authorId: z.string().uuid(),
  agencyId: z.string().min(1),
  sourceIds: z.array(z.string()).optional(),
});

export type GenerateEnrichedArticleInput = z.infer<typeof GenerateEnrichedArticleInputSchema>;

export class GenerateEnrichedArticleCommand {
  constructor(
    private readonly articleRepository: ArticleRepositoryPort,
    private readonly aiGenerator: AiGeneratorPort,
    private readonly feedRepository: FeedRepositoryPort,
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

  async execute(input: GenerateEnrichedArticleInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      let curatedSources: CuratedSource[] = [];

      if (input.sourceIds && input.sourceIds.length > 0) {
        const items = await this.feedRepository.findItemsByIds(input.sourceIds);
        curatedSources = items.map((item) => ({
          id: item.id,
          title: item.title,
          link: item.link,
          summary: item.summary,
        }));
      } else {
        const toUseItems = await this.feedRepository.findItemsByAgency(input.agencyId, {
          curationStatus: "TO_USE",
          limit: 5,
        });
        curatedSources = toUseItems.map((item) => ({
          id: item.id,
          title: item.title,
          link: item.link,
          summary: item.summary,
        }));
      }

      if (curatedSources.length === 0) {
        return Result.fail(
          new DomainError(
            "No curated sources found. Mark articles as 'To use' in the curation feed first.",
            "NO_CURATED_SOURCES",
          ),
        );
      }

      const generateInput = {
        contentType: input.contentType,
        topic: input.topic,
        keywords: input.keywords,
        tone: input.tone,
        wordCount: input.wordCount,
        context: input.context,
        language: input.language,
        curatedSources,
      };

      let generated = await this.aiGenerator.generateEnriched(generateInput);
      let score = this.score(generated);

      if (score.overall < AUTO_CORRECT_THRESHOLD) {
        const issues = summarizeSeoIssues(score);
        const corrected = await this.aiGenerator.generateEnriched({
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
        sourceIds: curatedSources.map((s) => s.id),
      });

      await this.articleRepository.save(article);
      return Result.ok(toArticleDto(article));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
