import { randomUUID } from "crypto";
import { type ArticleDto, toArticleDto } from "@/modules/content/application/dto/article.dto";
import { Article } from "@/modules/content/domain/entities/article.entity";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import type { NotionClientPort } from "../../domain/ports/notion-client.port";

export const ImportFromNotionInputSchema = z.object({
  pageId: z.string(),
  accessToken: z.string(),
  authorId: z.string().uuid(),
  agencyId: z.string().uuid(),
});

export type ImportFromNotionInput = z.infer<typeof ImportFromNotionInputSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export class ImportFromNotionCommand {
  constructor(
    private readonly notionClient: NotionClientPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {}

  async execute(input: ImportFromNotionInput): Promise<Result<ArticleDto, DomainError>> {
    try {
      const page = await this.notionClient.getPage(input.pageId, input.accessToken);

      const seoMetadata = SeoMetadata.create({
        metaTitle: page.title.slice(0, 70),
        metaDescription: page.title.slice(0, 160),
        keywords: [],
        slug: slugify(page.title),
      });

      const article = Article.create(randomUUID(), {
        title: page.title,
        body: page.toMarkdown(),
        contentType: ContentType.ARTICLE,
        seoMetadata,
        authorId: input.authorId,
        agencyId: input.agencyId,
        notionPageId: page.id,
      });

      await this.articleRepository.save(article);
      return Result.ok(toArticleDto(article));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
