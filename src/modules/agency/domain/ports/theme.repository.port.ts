import type { Theme } from "../entities/theme.entity";

export interface ThemeRepositoryPort {
  findById(id: string): Promise<Theme | null>;
  findByAgencyId(agencyId: string): Promise<Theme[]>;
  save(theme: Theme): Promise<void>;
  delete(id: string): Promise<void>;
}
