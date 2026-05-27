import type { DataSource, Repository } from "typeorm";
import type { Theme } from "../../domain/entities/theme.entity";
import type { ThemeRepositoryPort } from "../../domain/ports/theme.repository.port";
import { ThemeTypeormEntity } from "../entities/theme.typeorm-entity";
import { ThemeMapper } from "../mappers/theme.mapper";

export class TypeormThemeRepository implements ThemeRepositoryPort {
  private readonly repo: Repository<ThemeTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ThemeTypeormEntity);
  }

  async findById(id: string): Promise<Theme | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? ThemeMapper.toDomain(entity) : null;
  }

  async findByAgencyId(agencyId: string): Promise<Theme[]> {
    const entities = await this.repo.findBy({ agencyId });
    return entities.map(ThemeMapper.toDomain);
  }

  async save(theme: Theme): Promise<void> {
    await this.repo.save(ThemeMapper.toPersistence(theme));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
