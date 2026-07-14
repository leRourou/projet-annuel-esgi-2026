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
  scheduledAt?: Date;
  imagePrompt?: string;
  publishedAt?: Date;
  bodyPurgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Article extends AggregateRoot<string> {
  static readonly BODY_RETENTION_DAYS = 30;

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

  get scheduledAt(): Date | undefined {
    return this.props.scheduledAt;
  }

  get imagePrompt(): string | undefined {
    return this.props.imagePrompt;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get bodyPurgedAt(): Date | undefined {
    return this.props.bodyPurgedAt;
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

  update(params: {
    title?: string;
    body?: string;
    seoMetadata?: SeoMetadata;
    imagePrompt?: string;
  }): void {
    if (this.props.status.value === "PUBLISHED") {
      throw new DomainError("Cannot edit a published article", "ARTICLE_ALREADY_PUBLISHED");
    }
    this.props = {
      ...this.props,
      ...(params.title !== undefined && { title: params.title }),
      ...(params.body !== undefined && { body: params.body }),
      ...(params.seoMetadata !== undefined && { seoMetadata: params.seoMetadata }),
      ...(params.imagePrompt !== undefined && { imagePrompt: params.imagePrompt }),
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
    const now = new Date();
    this.props = {
      ...this.props,
      status: nextStatus,
      updatedAt: now,
      ...(nextStatus.value === "PUBLISHED" && { publishedAt: this.props.publishedAt ?? now }),
    };
    if (nextStatus.value === "PUBLISHED") {
      this.addDomainEvent(new ArticlePublishedEvent(this.id, this.props.authorId));
    }
  }

  isEligibleForBodyPurge(now: Date): boolean {
    if (this.props.status.value !== "PUBLISHED" || !this.props.publishedAt) return false;
    if (this.props.bodyPurgedAt) return false;
    const retentionMs = Article.BODY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return now.getTime() - this.props.publishedAt.getTime() >= retentionMs;
  }

  purgeBody(now: Date): void {
    if (!this.isEligibleForBodyPurge(now)) {
      throw new DomainError(
        "Article is not eligible for body purge yet",
        "BODY_PURGE_NOT_ELIGIBLE",
      );
    }
    this.props = { ...this.props, body: "", bodyPurgedAt: now, updatedAt: now };
  }

  daysUntilBodyPurge(now: Date): number | null {
    if (this.props.status.value !== "PUBLISHED" || !this.props.publishedAt) return null;
    if (this.props.bodyPurgedAt) return null;
    const retentionMs = Article.BODY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const remainingMs = this.props.publishedAt.getTime() + retentionMs - now.getTime();
    return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  }

  schedulePublication(date: Date): void {
    this.props = { ...this.props, scheduledAt: date, updatedAt: new Date() };
  }

  linkToNotion(pageId: string): void {
    this.props = { ...this.props, notionPageId: pageId, updatedAt: new Date() };
  }
}
