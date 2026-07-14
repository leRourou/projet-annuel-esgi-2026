import { paginate } from "@/shared/domain/types/pagination.type";
import type { PaginatedResult, PaginationParams } from "@/shared/domain/types/pagination.type";
import type { DataSource, Repository } from "typeorm";
import type { Article } from "../../domain/entities/article.entity";
import type {
  ArticleFilters,
  ArticleRepositoryPort,
} from "../../domain/ports/article.repository.port";
import { ArticleTypeormEntity } from "../entities/article.typeorm-entity";
import { ArticleMapper } from "../mappers/article.mapper";

export class TypeormArticleRepository implements ArticleRepositoryPort {
  private readonly repo: Repository<ArticleTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ArticleTypeormEntity);
  }

  async findById(id: string): Promise<Article | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? ArticleMapper.toDomain(entity) : null;
  }

  async findAll(
    filters: ArticleFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Article>> {
    const qb = this.repo.createQueryBuilder("article");

    qb.andWhere("article.agency_id = :agencyId", { agencyId: filters.agencyId });

    if (filters.authorId) {
      qb.andWhere("article.author_id = :authorId", { authorId: filters.authorId });
    }
    if (filters.status) {
      qb.andWhere("article.status = :status", { status: filters.status });
    }
    if (filters.tagId) {
      qb.andWhere(":tagId = ANY(article.tag_ids)", { tagId: filters.tagId });
    }

    const [entities, total] = await qb
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .orderBy("article.created_at", "DESC")
      .getManyAndCount();

    return paginate(entities.map(ArticleMapper.toDomain), total, pagination);
  }

  async findScheduled(agencyId: string): Promise<Article[]> {
    const entities = await this.repo
      .createQueryBuilder("article")
      .where("article.agency_id = :agencyId", { agencyId })
      .andWhere("article.scheduled_at IS NOT NULL")
      .orderBy("article.scheduled_at", "ASC")
      .getMany();
    return entities.map(ArticleMapper.toDomain);
  }

  async findPublishedBefore(cutoffDate: Date): Promise<Article[]> {
    const entities = await this.repo
      .createQueryBuilder("article")
      .where("article.status = 'PUBLISHED'")
      .andWhere("article.published_at <= :cutoffDate", { cutoffDate })
      .andWhere("article.body_purged_at IS NULL")
      .getMany();
    return entities.map(ArticleMapper.toDomain);
  }

  async save(article: Article): Promise<void> {
    const data = ArticleMapper.toPersistence(article);
    await this.repo.save(data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
