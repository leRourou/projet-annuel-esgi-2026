import type { ThemeRepositoryPort } from "../../domain/ports/theme.repository.port";
import type { ThemeDto } from "../dto/theme.dto";

export class ListThemesQuery {
  constructor(private readonly themeRepository: ThemeRepositoryPort) {}

  async execute(agencyId: string): Promise<ThemeDto[]> {
    const themes = await this.themeRepository.findByAgencyId(agencyId);
    return themes.map((t) => ({
      id: t.id,
      name: t.name,
      agencyId: t.agencyId,
      createdAt: t.createdAt,
    }));
  }
}
