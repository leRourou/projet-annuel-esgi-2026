import { Theme } from "../../domain/entities/theme.entity";
import type { ThemeTypeormEntity } from "../entities/theme.typeorm-entity";

export class ThemeMapper {
  static toDomain(entity: ThemeTypeormEntity): Theme {
    return Theme.reconstitute(entity.id, {
      name: entity.name,
      agencyId: entity.agencyId,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(theme: Theme): Partial<ThemeTypeormEntity> {
    return {
      id: theme.id,
      name: theme.name,
      agencyId: theme.agencyId,
    };
  }
}
