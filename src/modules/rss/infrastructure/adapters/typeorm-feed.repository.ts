import type { DataSource, Repository } from "typeorm";
import type { FeedRepositoryPort } from "../../domain/ports/feed.repository.port";
import type { Feed } from "../../domain/entities/feed.entity";
import type { FeedItem } from "../../domain/entities/feed-item.entity";
import { FeedTypeormEntity } from "../entities/feed.typeorm-entity";
import { FeedItemTypeormEntity } from "../entities/feed-item.typeorm-entity";
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

  async findItemsByFeedId(feedId: string, limit = 50): Promise<FeedItem[]> {
    const entities = await this.itemRepo.find({
      where: { feedId },
      order: { publishedAt: "DESC" },
      take: limit,
    });
    return entities.map(FeedMapper.feedItemToDomain);
  }

  async deleteFeed(id: string): Promise<void> {
    await this.feedRepo.delete({ id });
  }
}
