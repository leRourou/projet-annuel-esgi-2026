import type { DataSource, Repository } from "typeorm";
import type { Tag } from "../../domain/entities/tag.entity";
import type { TagRepositoryPort } from "../../domain/ports/tag.repository.port";
import { TagTypeormEntity } from "../entities/tag.typeorm-entity";
import { TagMapper } from "../mappers/tag.mapper";

export class TypeormTagRepository implements TagRepositoryPort {
  private readonly repo: Repository<TagTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(TagTypeormEntity);
  }

  async findById(id: string): Promise<Tag | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findByAgencyId(agencyId: string): Promise<Tag[]> {
    const entities = await this.repo.findBy({ agencyId });
    return entities.map(TagMapper.toDomain);
  }

  async save(tag: Tag): Promise<void> {
    await this.repo.save(TagMapper.toPersistence(tag));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
