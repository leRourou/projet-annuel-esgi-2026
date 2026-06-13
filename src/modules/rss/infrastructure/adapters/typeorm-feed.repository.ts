import type { DataSource, Repository } from "typeorm";
import type { FeedItem } from "../../domain/entities/feed-item.entity";
import type { Feed } from "../../domain/entities/feed.entity";
import type { FeedItemFilters, FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import { FeedItemTypeormEntity } from "../entities/feed-item.typeorm-entity";
import { FeedTypeormEntity } from "../entities/feed.typeorm-entity";
import { FeedMapper } from "../mappers/feed.mapper";

export class TypeormFeedRepository implements FeedRepositoryPort {
  private readonly feedRepo: Repository<FeedTypeormEntity>;
  private readonly itemRepo: Repository<FeedItemTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.feedRepo = dataSource.getRepository(FeedTypeormEntity);
    this.itemRepo = dataSource.getRepository(FeedItemTypeormEntity);
  }

  async findById(id: string): Promise<Feed | null> {
    const entity = await this.feedRepo.findOneBy({ id });
    return entity ? FeedMapper.feedToDomain(entity) : null;
  }

  async findAllByOwner(ownerId: string): Promise<Feed[]> {
    const entities = await this.feedRepo.findBy({ ownerId });
    return entities.map(FeedMapper.feedToDomain);
  }

  async findAllByAgency(agencyId: string): Promise<Feed[]> {
    const entities = await this.feedRepo.findBy({ agencyId });
    return entities.map(FeedMapper.feedToDomain);
  }

  async findAll(): Promise<Feed[]> {
    const entities = await this.feedRepo.find();
    return entities.map(FeedMapper.feedToDomain);
  }

  async saveFeed(feed: Feed): Promise<void> {
    await this.feedRepo.save(FeedMapper.feedToPersistence(feed));
  }

  async saveFeedItems(items: FeedItem[]): Promise<void> {
    const entities = items.map(FeedMapper.feedItemToPersistence);
    await this.itemRepo.upsert(entities, ["id"]);
  }

  async saveFeedItem(item: FeedItem): Promise<void> {
    await this.itemRepo.save(FeedMapper.feedItemToPersistence(item));
  }

  async findItemsByFeedId(feedId: string, limit = 50): Promise<FeedItem[]> {
    const entities = await this.itemRepo.find({
      where: { feedId },
      order: { publishedAt: "DESC" },
      take: limit,
    });
    return entities.map(FeedMapper.feedItemToDomain);
  }

  async findItemsByAgency(agencyId: string, filters: FeedItemFilters = {}): Promise<FeedItem[]> {
    const feeds = await this.feedRepo.findBy({ agencyId });
    if (feeds.length === 0) return [];

    const feedIds = feeds.map((f) => f.id);

    const qb = this.itemRepo
      .createQueryBuilder("item")
      .where("item.feed_id IN (:...feedIds)", { feedIds })
      .orderBy("item.published_at", "DESC");

    if (filters.curationStatus) {
      qb.andWhere("item.curation_status = :status", { status: filters.curationStatus });
    }

    if (filters.tagId) {
      qb.andWhere(":tagId = ANY(item.tag_ids)", { tagId: filters.tagId });
    }

    if (filters.limit) {
      qb.take(filters.limit);
    }

    const entities = await qb.getMany();
    return entities.map(FeedMapper.feedItemToDomain);
  }

  async findItemById(id: string): Promise<FeedItem | null> {
    const entity = await this.itemRepo.findOneBy({ id });
    return entity ? FeedMapper.feedItemToDomain(entity) : null;
  }

  async deleteFeed(id: string): Promise<void> {
    await this.feedRepo.delete({ id });
  }
}
