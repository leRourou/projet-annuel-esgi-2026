import { AggregateRoot } from "@/shared/domain/base/aggregate-root.base";
import type { FeedUrl } from "../value-objects/feed-url.vo";

export const FEED_SOURCE_TYPES = ["RSS", "NOTION"] as const;
export type FeedSourceType = (typeof FEED_SOURCE_TYPES)[number];

export interface FeedProps {
  name: string;
  url: FeedUrl;
  ownerId: string;
  agencyId: string;
  lastFetchedAt?: Date;
  createdAt: Date;
  sourceType: FeedSourceType;
  notionDatabaseId?: string | null;
}

export class Feed extends AggregateRoot<string> {
  private constructor(
    id: string,
    private props: FeedProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    params: Omit<FeedProps, "createdAt" | "sourceType" | "notionDatabaseId"> &
      Partial<Pick<FeedProps, "sourceType" | "notionDatabaseId">>,
  ): Feed {
    return new Feed(id, {
      ...params,
      createdAt: new Date(),
      sourceType: params.sourceType ?? "RSS",
      notionDatabaseId: params.notionDatabaseId ?? null,
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

  get sourceType(): FeedSourceType {
    return this.props.sourceType;
  }

  get notionDatabaseId(): string | null | undefined {
    return this.props.notionDatabaseId;
  }

  markFetched(): void {
    this.props = { ...this.props, lastFetchedAt: new Date() };
  }
}
