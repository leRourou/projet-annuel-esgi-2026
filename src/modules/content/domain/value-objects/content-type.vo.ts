import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export type ContentTypeValue =
  | "ARTICLE"
  | "PRODUCT_SHEET"
  | "META"
  | "LINKEDIN_POST"
  | "FACEBOOK_POST";

interface ContentTypeProps {
  readonly value: ContentTypeValue;
}

export class ContentType extends ValueObject<ContentTypeProps> {
  static readonly ARTICLE = new ContentType({ value: "ARTICLE" });
  static readonly PRODUCT_SHEET = new ContentType({ value: "PRODUCT_SHEET" });
  static readonly META = new ContentType({ value: "META" });
  static readonly LINKEDIN_POST = new ContentType({ value: "LINKEDIN_POST" });
  static readonly FACEBOOK_POST = new ContentType({ value: "FACEBOOK_POST" });

  private static readonly VALID: ContentTypeValue[] = [
    "ARTICLE",
    "PRODUCT_SHEET",
    "META",
    "LINKEDIN_POST",
    "FACEBOOK_POST",
  ];

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
