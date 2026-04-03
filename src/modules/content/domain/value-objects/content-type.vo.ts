import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/base/value-object.base";

export type ContentTypeValue = "ARTICLE" | "PRODUCT_SHEET" | "META";

interface ContentTypeProps {
  readonly value: ContentTypeValue;
}

export class ContentType extends ValueObject<ContentTypeProps> {
  static readonly ARTICLE = new ContentType({ value: "ARTICLE" });
  static readonly PRODUCT_SHEET = new ContentType({ value: "PRODUCT_SHEET" });
  static readonly META = new ContentType({ value: "META" });

  private static readonly VALID: ContentTypeValue[] = ["ARTICLE", "PRODUCT_SHEET", "META"];

  private constructor(props: ContentTypeProps) {
    super(props);
  }

  static create(value: string): ContentType {
    if (!ContentType.VALID.includes(value as ContentTypeValue)) {
      throw new DomainError(`"${value}" is not a valid content type`, "INVALID_CONTENT_TYPE");
    }
    return new ContentType({ value: value as ContentTypeValue });
  }

  get value(): ContentTypeValue {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
