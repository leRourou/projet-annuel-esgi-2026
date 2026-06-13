import { Entity } from "@/shared/domain/base/entity.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export interface TagProps {
  name: string;
  agencyId: string;
  createdAt: Date;
}

export class Tag extends Entity<string> {
  private constructor(
    id: string,
    private props: TagProps,
  ) {
    super(id);
  }

  static create(id: string, params: { name: string; agencyId: string }): Tag {
    const trimmed = params.name.trim();
    if (!trimmed) {
      throw new DomainError("Tag name cannot be empty", "INVALID_TAG_NAME");
    }
    if (trimmed.length > 50) {
      throw new DomainError("Tag name must be 50 characters or less", "TAG_NAME_TOO_LONG");
    }
    return new Tag(id, { name: trimmed, agencyId: params.agencyId, createdAt: new Date() });
  }

  static reconstitute(id: string, props: TagProps): Tag {
    return new Tag(id, props);
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
}
