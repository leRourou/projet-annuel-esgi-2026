import type { Theme } from "../../domain/entities/theme.entity";

export interface ThemeDto {
  id: string;
  name: string;
  agencyId: string;
  createdAt: Date;
}

export function toThemeDto(theme: Theme): ThemeDto {
  return {
    id: theme.id,
    name: theme.name,
    agencyId: theme.agencyId,
    createdAt: theme.createdAt,
  };
}
