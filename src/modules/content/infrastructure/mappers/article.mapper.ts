import { Article } from "../../domain/entities/article.entity";
import { ContentStatus } from "../../domain/value-objects/content-status.vo";
import { ContentType } from "../../domain/value-objects/content-type.vo";
import { SeoMetadata } from "../../domain/value-objects/seo-metadata.vo";
import type { ArticleTypeormEntity } from "../entities/article.typeorm-entity";

export class ArticleMapper {
  static toDomain(entity: ArticleTypeormEntity): Article {
    return Article.reconstitute(entity.id, {
      title: entity.title,
      body: entity.body,
      contentType: ContentType.create(entity.contentType),
      status: ContentStatus.create(entity.status),
      seoMetadata: SeoMetadata.create({
        metaTitle: entity.metaTitle,
        metaDescription: entity.metaDescription,
        keywords: entity.keywords,
        slug: entity.slug,
        excerpt: entity.excerpt ?? undefined,
      }),
      tagIds: entity.tagIds ?? [],
      sourceIds: entity.sourceIds ?? [],
      authorId: entity.authorId,
      agencyId: entity.agencyId ?? "",
      notionPageId: entity.notionPageId ?? undefined,
      scheduledAt: entity.scheduledAt ?? undefined,
      imagePrompt: entity.imagePrompt ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(article: Article): Partial<ArticleTypeormEntity> {
    return {
      id: article.id,
      title: article.title,
      body: article.body,
      contentType: article.contentType.value,
      status: article.status.value,
      metaTitle: article.seoMetadata.metaTitle,
      metaDescription: article.seoMetadata.metaDescription,
      keywords: [...article.seoMetadata.keywords],
      slug: article.seoMetadata.slug,
      excerpt: article.seoMetadata.excerpt ?? null,
      tagIds: [...article.tagIds],
      sourceIds: [...article.sourceIds],
      authorId: article.authorId,
      agencyId: article.agencyId || null,
      notionPageId: article.notionPageId ?? null,
      scheduledAt: article.scheduledAt ?? null,
      imagePrompt: article.imagePrompt ?? null,
    };
  }
}
