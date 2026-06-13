import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

interface SeoMetadataProps {
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly keywords: readonly string[];
  readonly slug: string;
  readonly excerpt?: string;
}

export class SeoMetadata extends ValueObject<SeoMetadataProps> {
  private static readonly MAX_TITLE_LENGTH = 70;
  private static readonly MAX_DESCRIPTION_LENGTH = 160;
  private static readonly MAX_EXCERPT_LENGTH = 300;
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  private constructor(props: SeoMetadataProps) {
    super(props);
  }

  static create(params: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    slug: string;
    excerpt?: string;
  }): SeoMetadata {
    if (params.metaTitle.length > SeoMetadata.MAX_TITLE_LENGTH) {
      throw new DomainError(
        `Meta title exceeds ${SeoMetadata.MAX_TITLE_LENGTH} characters`,
        "SEO_TITLE_TOO_LONG",
      );
    }
    if (params.metaDescription.length > SeoMetadata.MAX_DESCRIPTION_LENGTH) {
      throw new DomainError(
        `Meta description exceeds ${SeoMetadata.MAX_DESCRIPTION_LENGTH} characters`,
        "SEO_DESCRIPTION_TOO_LONG",
      );
    }
    if (!SeoMetadata.SLUG_REGEX.test(params.slug)) {
      throw new DomainError(`"${params.slug}" is not a valid slug`, "INVALID_SLUG");
    }
    if (params.excerpt && params.excerpt.length > SeoMetadata.MAX_EXCERPT_LENGTH) {
      throw new DomainError(
        `Excerpt exceeds ${SeoMetadata.MAX_EXCERPT_LENGTH} characters`,
        "SEO_EXCERPT_TOO_LONG",
      );
    }
    return new SeoMetadata({
      metaTitle: params.metaTitle,
      metaDescription: params.metaDescription,
      keywords: Object.freeze([...params.keywords]),
      slug: params.slug,
      excerpt: params.excerpt,
    });
  }

  get metaTitle(): string {
    return this.props.metaTitle;
  }

  get metaDescription(): string {
    return this.props.metaDescription;
  }

  get keywords(): readonly string[] {
    return this.props.keywords;
  }

  get slug(): string {
    return this.props.slug;
  }

  get excerpt(): string | undefined {
    return this.props.excerpt;
  }
}
