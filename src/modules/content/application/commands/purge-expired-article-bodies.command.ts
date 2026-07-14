import type { ArticleRepositoryPort } from "../../domain/ports/article.repository.port";

export interface PurgeExpiredArticleBodiesResult {
  purged: number;
  failed: number;
}

export class PurgeExpiredArticleBodiesCommand {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(now: Date = new Date()): Promise<PurgeExpiredArticleBodiesResult> {
    const retentionMs = 30 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now.getTime() - retentionMs);
    const candidates = await this.articleRepository.findPublishedBefore(cutoffDate);

    let purged = 0;
    let failed = 0;

    for (const article of candidates) {
      if (!article.isEligibleForBodyPurge(now)) continue;
      try {
        article.purgeBody(now);
        await this.articleRepository.save(article);
        purged++;
      } catch {
        failed++;
      }
    }

    return { purged, failed };
  }
}
