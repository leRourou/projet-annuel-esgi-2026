import { AggregateRoot } from "@/shared/domain/base/aggregate-root.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export interface AgencyProps {
  name: string;
  slug: string;
  createdAt: Date;
}

export class Agency extends AggregateRoot<string> {
  private constructor(
    id: string,
    private props: AgencyProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    params: {
      name: string;
      slug: string;
    },
  ): Agency {
    const trimmedName = params.name.trim();
    if (!trimmedName) {
      throw new DomainError("Agency name cannot be empty", "INVALID_AGENCY_NAME");
    }

    const trimmedSlug = params.slug.trim().toLowerCase();
    if (!trimmedSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
      throw new DomainError(
        "Agency slug must contain only lowercase letters, numbers and hyphens",
        "INVALID_AGENCY_SLUG",
      );
    }

    return new Agency(id, {
      name: trimmedName,
      slug: trimmedSlug,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: AgencyProps): Agency {
    return new Agency(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  updateName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new DomainError("Agency name cannot be empty", "INVALID_AGENCY_NAME");
    }
    this.props = { ...this.props, name: trimmed };
  }
}
