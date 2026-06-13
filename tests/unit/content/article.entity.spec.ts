import { Article } from "@/modules/content/domain/entities/article.entity";
import { ContentStatus } from "@/modules/content/domain/value-objects/content-status.vo";
import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { SeoMetadata } from "@/modules/content/domain/value-objects/seo-metadata.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

function makeSeo() {
  return SeoMetadata.create({
    metaTitle: "Test title",
    metaDescription: "Test description",
    keywords: ["keyword"],
    slug: "test-slug",
  });
}

function makeArticle() {
  return Article.create("a-1", {
    title: "Hello World",
    body: "Content here",
    contentType: ContentType.ARTICLE,
    seoMetadata: makeSeo(),
    authorId: "user-1",
    agencyId: "agency-1",
  });
}

describe("Article", () => {
  it("starts with DRAFT status", () => {
    const article = makeArticle();
    expect(article.status.value).toBe("DRAFT");
  });

  it("throws when title is empty", () => {
    expect(() =>
      Article.create("a-1", {
        title: "  ",
        body: "body",
        contentType: ContentType.ARTICLE,
        seoMetadata: makeSeo(),
        authorId: "user-1",
        agencyId: "agency-1",
      }),
    ).toThrow(DomainError);
  });

  it("can transition DRAFT → REVIEW", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    expect(article.status.value).toBe("REVIEW");
  });

  it("cannot transition DRAFT → PUBLISHED", () => {
    const article = makeArticle();
    expect(() => article.transitionTo(ContentStatus.PUBLISHED)).toThrow(DomainError);
  });

  it("can transition REVIEW → VALIDATED", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    expect(article.status.value).toBe("VALIDATED");
  });

  it("cannot transition REVIEW → PUBLISHED directly", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    expect(() => article.transitionTo(ContentStatus.PUBLISHED)).toThrow(DomainError);
  });

  it("emits ArticlePublishedEvent on publish via VALIDATED", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    expect(article.domainEvents).toHaveLength(1);
    expect(article.domainEvents[0]?.eventName).toBe("ArticlePublished");
  });

  it("emits ArticlePublishedEvent on publish via SCHEDULED", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.SCHEDULED);
    article.transitionTo(ContentStatus.PUBLISHED);
    expect(article.domainEvents).toHaveLength(1);
    expect(article.domainEvents[0]?.eventName).toBe("ArticlePublished");
  });

  it("cannot edit a published article", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    expect(() => article.update({ title: "New title" })).toThrow(DomainError);
  });
});
