import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export const CONTENT_TYPES = [
  "ARTICLE",
  "PRODUCT_SHEET",
  "META",
  "LINKEDIN_POST",
  "FACEBOOK_POST",
  "INSTAGRAM_POST",
  "SUBSTACK_ARTICLE",
] as const;

export type ContentTypeValue = (typeof CONTENT_TYPES)[number];

interface ContentTypeProps {
  readonly value: ContentTypeValue;
}

export class ContentType extends ValueObject<ContentTypeProps> {
  static readonly ARTICLE = new ContentType({ value: "ARTICLE" });
  static readonly PRODUCT_SHEET = new ContentType({ value: "PRODUCT_SHEET" });
  static readonly META = new ContentType({ value: "META" });
  static readonly LINKEDIN_POST = new ContentType({ value: "LINKEDIN_POST" });
  static readonly FACEBOOK_POST = new ContentType({ value: "FACEBOOK_POST" });
  static readonly INSTAGRAM_POST = new ContentType({ value: "INSTAGRAM_POST" });
  static readonly SUBSTACK_ARTICLE = new ContentType({ value: "SUBSTACK_ARTICLE" });

  private constructor(props: ContentTypeProps) {
    super(props);
  }

  static create(value: string): ContentType {
    if (!CONTENT_TYPES.includes(value as ContentTypeValue)) {
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
