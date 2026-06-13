import type { Tag } from "../../domain/entities/tag.entity";

export interface TagDto {
  id: string;
  name: string;
  agencyId: string;
  createdAt: Date;
}

export function toTagDto(tag: Tag): TagDto {
  return {
    id: tag.id,
    name: tag.name,
    agencyId: tag.agencyId,
    createdAt: tag.createdAt,
  };
}
