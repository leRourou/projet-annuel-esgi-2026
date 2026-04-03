import { z } from "zod";
import type { Article } from "../../domain/entities/article.entity";

export const ArticleDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  contentType: z.enum(["ARTICLE", "PRODUCT_SHEET", "META"]),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]),
  seoMetadata: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    keywords: z.array(z.string()),
    slug: z.string(),
  }),
  authorId: z.string().uuid(),
  notionPageId: z.string().optional(),
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
    },
    authorId: article.authorId,
    notionPageId: article.notionPageId,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}
