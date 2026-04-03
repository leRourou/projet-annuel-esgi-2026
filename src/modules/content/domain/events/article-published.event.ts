import { DomainEvent } from "@/shared/domain/base/domain-event.base";

export class ArticlePublishedEvent extends DomainEvent {
  constructor(
    public readonly articleId: string,
    public readonly authorId: string,
  ) {
    super("ArticlePublished");
  }
}
