import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export type ContentStatusValue = "DRAFT" | "REVIEW" | "PUBLISHED";

interface ContentStatusProps {
  readonly value: ContentStatusValue;
}

export class ContentStatus extends ValueObject<ContentStatusProps> {
  static readonly DRAFT = new ContentStatus({ value: "DRAFT" });
  static readonly REVIEW = new ContentStatus({ value: "REVIEW" });
  static readonly PUBLISHED = new ContentStatus({ value: "PUBLISHED" });

  private static readonly VALID: ContentStatusValue[] = ["DRAFT", "REVIEW", "PUBLISHED"];

  private constructor(props: ContentStatusProps) {
    super(props);
  }

  static create(value: string): ContentStatus {
    if (!ContentStatus.VALID.includes(value as ContentStatusValue)) {
      throw new DomainError(`"${value}" is not a valid content status`, "INVALID_CONTENT_STATUS");
    }
    return new ContentStatus({ value: value as ContentStatusValue });
  }

  get value(): ContentStatusValue {
    return this.props.value;
  }

  canTransitionTo(next: ContentStatus): boolean {
    const transitions: Record<ContentStatusValue, ContentStatusValue[]> = {
      DRAFT: ["REVIEW"],
      REVIEW: ["DRAFT", "PUBLISHED"],
      PUBLISHED: [],
    };
    return transitions[this.props.value].includes(next.props.value);
  }

  toString(): string {
    return this.props.value;
  }
}
