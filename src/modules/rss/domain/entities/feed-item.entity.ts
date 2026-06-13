import { Entity } from "@/shared/domain/base/entity.base";
import { CurationStatus } from "../value-objects/curation-status.vo";

export interface FeedItemProps {
  feedId: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
  curationStatus: CurationStatus;
  tagIds: string[];
}

export class FeedItem extends Entity<string> {
  private constructor(
    id: string,
    private props: FeedItemProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    props: Omit<FeedItemProps, "curationStatus" | "tagIds"> &
      Partial<Pick<FeedItemProps, "curationStatus" | "tagIds">>,
  ): FeedItem {
    return new FeedItem(id, {
      ...props,
      curationStatus: props.curationStatus ?? CurationStatus.unread(),
      tagIds: props.tagIds ?? [],
    });
  }

  qualify(status: CurationStatus): void {
    this.props.curationStatus = status;
  }

  assignTags(tagIds: string[]): void {
    this.props.tagIds = [...tagIds];
  }

  get feedId(): string {
    return this.props.feedId;
  }

  get title(): string {
    return this.props.title;
  }

  get link(): string {
    return this.props.link;
  }

  get summary(): string {
    return this.props.summary;
  }

  get publishedAt(): Date {
    return this.props.publishedAt;
  }

  get curationStatus(): CurationStatus {
    return this.props.curationStatus;
  }

  get tagIds(): string[] {
    return [...this.props.tagIds];
  }
}
