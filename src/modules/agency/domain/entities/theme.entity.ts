import { Entity } from "@/shared/domain/base/entity.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export interface ThemeProps {
  name: string;
  agencyId: string;
  createdAt: Date;
}

export class Theme extends Entity<string> {
  private constructor(
    id: string,
    private props: ThemeProps,
  ) {
    super(id);
  }

  static create(id: string, params: { name: string; agencyId: string }): Theme {
    const trimmed = params.name.trim();
    if (!trimmed) {
      throw new DomainError("Theme name cannot be empty", "INVALID_THEME_NAME");
    }
    if (trimmed.length > 100) {
      throw new DomainError("Theme name must be 100 characters or less", "THEME_NAME_TOO_LONG");
    }
    return new Theme(id, { name: trimmed, agencyId: params.agencyId, createdAt: new Date() });
  }

  static reconstitute(id: string, props: ThemeProps): Theme {
    return new Theme(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get agencyId(): string {
    return this.props.agencyId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  rename(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new DomainError("Theme name cannot be empty", "INVALID_THEME_NAME");
    }
    if (trimmed.length > 100) {
      throw new DomainError("Theme name must be 100 characters or less", "THEME_NAME_TOO_LONG");
    }
    this.props = { ...this.props, name: trimmed };
  }
}
