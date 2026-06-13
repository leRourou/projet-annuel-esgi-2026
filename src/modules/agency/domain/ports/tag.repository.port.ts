import type { Tag } from "../entities/tag.entity";

export interface TagRepositoryPort {
  findById(id: string): Promise<Tag | null>;
  findByAgencyId(agencyId: string): Promise<Tag[]>;
  save(tag: Tag): Promise<void>;
  delete(id: string): Promise<void>;
}
