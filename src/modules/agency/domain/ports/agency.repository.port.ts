import type { Agency } from "../entities/agency.entity";

export interface AgencyRepositoryPort {
  findById(id: string): Promise<Agency | null>;
  findBySlug(slug: string): Promise<Agency | null>;
  save(agency: Agency): Promise<void>;
  delete(id: string): Promise<void>;
}
