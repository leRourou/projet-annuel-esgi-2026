import { AggregateRoot } from "@/shared/domain/base/aggregate-root.base";
import type { FeedUrl } from "../value-objects/feed-url.vo";

export interface FeedProps {
  name: string;
  url: FeedUrl;
  ownerId: string;
  agencyId: string;
  lastFetchedAt?: Date;
  createdAt: Date;
}

export class Feed extends AggregateRoot<string> {
  private constructor(
    id: string,
    private props: FeedProps,
  ) {
    super(id);
  }

  static create(id: string, params: Omit<FeedProps, "createdAt">): Feed {
    return new Feed(id, {
      ...params,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: FeedProps): Feed {
    return new Feed(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get url(): FeedUrl {
    return this.props.url;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get agencyId(): string {
    return this.props.agencyId;
  }

  get lastFetchedAt(): Date | undefined {
    return this.props.lastFetchedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markFetched(): void {
    this.props = { ...this.props, lastFetchedAt: new Date() };
  }
}
