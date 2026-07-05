import { z } from "zod";
import type { Article } from "../../domain/entities/article.entity";
import { ScoreContentSeoQuery } from "../queries/score-content-seo.query";

const seoScoreQuery = new ScoreContentSeoQuery();

export const ArticleDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  contentType: z.enum(["ARTICLE", "PRODUCT_SHEET", "META", "LINKEDIN_POST", "FACEBOOK_POST"]),
  status: z.enum(["DRAFT", "REVIEW", "VALIDATED", "SCHEDULED", "PUBLISHED"]),
  seoMetadata: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    keywords: z.array(z.string()),
    slug: z.string(),
    excerpt: z.string().optional(),
  }),
  seoScore: z.object({
    overall: z.number(),
    breakdown: z.object({
      h1: z.number(),
      h2: z.number(),
      h3: z.number(),
      metaTitle: z.number(),
      metaDescription: z.number(),
      keywordInTitle: z.number(),
      keywordInBody: z.number(),
      wordCount: z.number(),
      excerpt: z.number(),
    }),
    details: z.object({
      h1Count: z.number(),
      h2Count: z.number(),
      h3Count: z.number(),
      metaTitleLength: z.number(),
      metaDescriptionLength: z.number(),
      wordCountValue: z.number(),
      keywordDensityPercent: z.number(),
    }),
  }),
  tagIds: z.array(z.string()),
  sourceIds: z.array(z.string()),
  authorId: z.string().uuid(),
  agencyId: z.string(),
  notionPageId: z.string().optional(),
  scheduledAt: z.date().optional(),
  imagePrompt: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ArticleDto = z.infer<typeof ArticleDtoSchema>;

export function toArticleDto(article: Article): ArticleDto {
  return {
    id: article.id,
    title: article.title,
    body: article.body,
    contentType: article.contentType.value,
    status: article.status.value,
    seoMetadata: {
      metaTitle: article.seoMetadata.metaTitle,
      metaDescription: article.seoMetadata.metaDescription,
      keywords: [...article.seoMetadata.keywords],
      slug: article.seoMetadata.slug,
      excerpt: article.seoMetadata.excerpt,
    },
    seoScore: seoScoreQuery.execute({
      title: article.title,
      body: article.body,
      seoMetadata: {
        metaTitle: article.seoMetadata.metaTitle,
        metaDescription: article.seoMetadata.metaDescription,
        keywords: article.seoMetadata.keywords,
        slug: article.seoMetadata.slug,
        excerpt: article.seoMetadata.excerpt,
      },
    }),
    tagIds: [...article.tagIds],
    sourceIds: [...article.sourceIds],
    authorId: article.authorId,
    agencyId: article.agencyId,
    notionPageId: article.notionPageId,
    scheduledAt: article.scheduledAt,
    imagePrompt: article.imagePrompt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}
