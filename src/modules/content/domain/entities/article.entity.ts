import { AggregateRoot } from "@/shared/domain/base/aggregate-root.base";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { ArticlePublishedEvent } from "../events/article-published.event";
import { ContentStatus } from "../value-objects/content-status.vo";
import type { ContentType } from "../value-objects/content-type.vo";
import type { SeoMetadata } from "../value-objects/seo-metadata.vo";

export interface ArticleProps {
  title: string;
  body: string;
  contentType: ContentType;
  status: ContentStatus;
  seoMetadata: SeoMetadata;
  authorId: string;
  agencyId: string;
  tagIds: string[];
  sourceIds: string[];
  notionPageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Article extends AggregateRoot<string> {
  private constructor(
    id: string,
    private props: ArticleProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    params: Omit<ArticleProps, "status" | "tagIds" | "sourceIds" | "createdAt" | "updatedAt"> &
      Partial<Pick<ArticleProps, "sourceIds">>,
  ): Article {
    if (!params.title.trim()) {
      throw new DomainError("Article title cannot be empty", "INVALID_ARTICLE_TITLE");
    }
    const now = new Date();
    return new Article(id, {
      ...params,
      status: ContentStatus.DRAFT,
      tagIds: [],
      sourceIds: params.sourceIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: ArticleProps): Article {
    return new Article(id, props);
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get contentType(): ContentType {
    return this.props.contentType;
  }

  get status(): ContentStatus {
    return this.props.status;
  }

  get seoMetadata(): SeoMetadata {
    return this.props.seoMetadata;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get agencyId(): string {
    return this.props.agencyId;
  }

  get tagIds(): string[] {
    return this.props.tagIds;
  }

  get sourceIds(): string[] {
    return this.props.sourceIds;
  }

  get notionPageId(): string | undefined {
    return this.props.notionPageId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  setTags(tagIds: string[]): void {
    this.props = { ...this.props, tagIds, updatedAt: new Date() };
  }

  update(params: { title?: string; body?: string; seoMetadata?: SeoMetadata }): void {
    if (this.props.status.value === "PUBLISHED") {
      throw new DomainError("Cannot edit a published article", "ARTICLE_ALREADY_PUBLISHED");
    }
    this.props = {
      ...this.props,
      ...params,
      updatedAt: new Date(),
    };
  }

  transitionTo(nextStatus: ContentStatus): void {
    if (!this.props.status.canTransitionTo(nextStatus)) {
      throw new DomainError(
        `Cannot transition from ${this.props.status.value} to ${nextStatus.value}`,
        "INVALID_STATUS_TRANSITION",
      );
    }
    this.props = { ...this.props, status: nextStatus, updatedAt: new Date() };
    if (nextStatus.value === "PUBLISHED") {
      this.addDomainEvent(new ArticlePublishedEvent(this.id, this.props.authorId));
    }
  }

  linkToNotion(pageId: string): void {
    this.props = { ...this.props, notionPageId: pageId, updatedAt: new Date() };
  }
}
