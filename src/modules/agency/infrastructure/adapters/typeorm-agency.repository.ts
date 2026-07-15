import { In } from "typeorm";
import type { DataSource, Repository } from "typeorm";
import type { Agency } from "../../domain/entities/agency.entity";
import type { AgencyRepositoryPort } from "../../domain/ports/agency.repository.port";
import { AgencyTypeormEntity } from "../entities/agency.typeorm-entity";
import { AgencyMapper } from "../mappers/agency.mapper";

export class TypeormAgencyRepository implements AgencyRepositoryPort {
  private readonly repo: Repository<AgencyTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(AgencyTypeormEntity);
  }

  async findById(id: string): Promise<Agency | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? AgencyMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Agency[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.findBy({ id: In(ids) });
    return entities.map(AgencyMapper.toDomain);
  }

  async findBySlug(slug: string): Promise<Agency | null> {
    const entity = await this.repo.findOneBy({ slug });
    return entity ? AgencyMapper.toDomain(entity) : null;
  }

  async save(agency: Agency): Promise<void> {
    await this.repo.save(AgencyMapper.toPersistence(agency));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
