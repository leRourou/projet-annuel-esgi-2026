import type { DataSource, Repository } from "typeorm";
import type { AgencyContext } from "../../domain/entities/agency-context.entity";
import type { AgencyContextRepositoryPort } from "../../domain/ports/agency-context.repository.port";
import { AgencyContextTypeormEntity } from "../entities/agency-context.typeorm-entity";
import { AgencyContextMapper } from "../mappers/agency-context.mapper";

export class TypeormAgencyContextRepository implements AgencyContextRepositoryPort {
  private readonly repo: Repository<AgencyContextTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(AgencyContextTypeormEntity);
  }

  async findByAgencyId(agencyId: string): Promise<AgencyContext | null> {
    const entity = await this.repo.findOneBy({ agencyId });
    return entity ? AgencyContextMapper.toDomain(entity) : null;
  }

  async save(context: AgencyContext): Promise<void> {
    await this.repo.save(AgencyContextMapper.toPersistence(context));
  }
}
