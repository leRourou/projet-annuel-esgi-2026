import { Entity } from "@/shared/domain/base/entity.base";

export interface FeedItemProps {
  feedId: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
}

export class FeedItem extends Entity<string> {
  private constructor(
    id: string,
    private readonly props: FeedItemProps,
  ) {
    super(id);
  }

  static create(id: string, props: FeedItemProps): FeedItem {
    return new FeedItem(id, props);
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
}
