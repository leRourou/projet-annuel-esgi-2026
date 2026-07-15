import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";
import { markdownToHtml, markdownToPlainText } from "../../domain/services/markdown-renderer";
import { ExportFormat } from "../../domain/value-objects/export-format.vo";

export interface ExportedArticleDto {
  filename: string;
  mimeType: string;
  content: string;
}

function renderContent(body: string, format: ExportFormat): string {
  switch (format.value) {
    case "HTML":
      return markdownToHtml(body);
    case "TEXT":
      return markdownToPlainText(body);
    default:
      return body;
  }
}

export class ExportArticleQuery {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(
    articleId: string,
    format: string,
  ): Promise<Result<ExportedArticleDto, NotFoundError | DomainError>> {
    let exportFormat: ExportFormat;
    try {
      exportFormat = ExportFormat.create(format);
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }

    const article = await this.articleRepository.findById(articleId);
    if (!article) {
      return Result.fail(new NotFoundError("Article", articleId));
    }

    if (article.bodyPurgedAt) {
      return Result.fail(
        new DomainError(
          "Article body has been purged under the retention policy and can no longer be exported",
          "ARTICLE_BODY_PURGED",
        ),
      );
    }

    return Result.ok({
      filename: `${article.seoMetadata.slug}.${exportFormat.extension}`,
      mimeType: exportFormat.mimeType,
      content: renderContent(article.body, exportFormat),
    });
  }
}
