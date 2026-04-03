import { Agency } from "../../domain/entities/agency.entity";
import type { AgencyTypeormEntity } from "../entities/agency.typeorm-entity";

export class AgencyMapper {
  static toDomain(entity: AgencyTypeormEntity): Agency {
    return Agency.reconstitute(entity.id, {
      name: entity.name,
      slug: entity.slug,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(agency: Agency): Partial<AgencyTypeormEntity> {
    return {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
    };
  }
}
