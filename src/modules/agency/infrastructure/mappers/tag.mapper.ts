import { Tag } from "../../domain/entities/tag.entity";
import type { TagTypeormEntity } from "../entities/tag.typeorm-entity";

export class TagMapper {
  static toDomain(entity: TagTypeormEntity): Tag {
    return Tag.reconstitute(entity.id, {
      name: entity.name,
      agencyId: entity.agencyId,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(tag: Tag): Partial<TagTypeormEntity> {
    return {
      id: tag.id,
      name: tag.name,
      agencyId: tag.agencyId,
    };
  }
}
