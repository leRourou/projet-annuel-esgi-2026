import type { ThemeRepositoryPort } from "../../domain/ports/theme.repository.port";
import { type ThemeDto, toThemeDto } from "../dto/theme.dto";

export class ListThemesQuery {
  constructor(private readonly themeRepository: ThemeRepositoryPort) {}

  async execute(agencyId: string): Promise<ThemeDto[]> {
    const themes = await this.themeRepository.findByAgencyId(agencyId);
    return themes.map(toThemeDto);
  }
}
