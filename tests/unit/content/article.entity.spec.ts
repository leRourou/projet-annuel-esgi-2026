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

  it("partial update only touches the provided fields", () => {
    const article = makeArticle();
    article.update({ body: "Updated content" });
    expect(article.body).toBe("Updated content");
    expect(article.title).toBe("Hello World");
    expect(article.seoMetadata).toBeDefined();
  });

  it("sets the image prompt without touching other fields", () => {
    const article = makeArticle();
    article.update({ imagePrompt: "A vivid illustration of the topic" });
    expect(article.imagePrompt).toBe("A vivid illustration of the topic");
    expect(article.title).toBe("Hello World");
    expect(article.body).toBe("Content here");
  });

  it("records publishedAt when transitioning to PUBLISHED", () => {
    const article = makeArticle();
    expect(article.publishedAt).toBeUndefined();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    expect(article.publishedAt).toBeInstanceOf(Date);
  });

  it("is not eligible for body purge before the 30-day retention period", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    const in15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    expect(article.isEligibleForBodyPurge(in15Days)).toBe(false);
  });

  it("is eligible for body purge 30 days after publication", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    const in31Days = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect(article.isEligibleForBodyPurge(in31Days)).toBe(true);
  });

  it("is never eligible for body purge when not published", () => {
    const article = makeArticle();
    const in31Days = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect(article.isEligibleForBodyPurge(in31Days)).toBe(false);
  });

  it("purgeBody clears the body and keeps metadata when eligible", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    const in31Days = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

    article.purgeBody(in31Days);

    expect(article.body).toBe("");
    expect(article.bodyPurgedAt).toEqual(in31Days);
    expect(article.title).toBe("Hello World");
    expect(article.seoMetadata.slug).toBe("test-slug");
  });

  it("purgeBody throws when the article is not eligible yet", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    const in15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    expect(() => article.purgeBody(in15Days)).toThrow(DomainError);
    expect(article.body).toBe("Content here");
  });

  it("daysUntilBodyPurge returns null when the article is not published", () => {
    const article = makeArticle();
    expect(article.daysUntilBodyPurge(new Date())).toBeNull();
  });

  it("daysUntilBodyPurge returns null once the body has been purged", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    const in31Days = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    article.purgeBody(in31Days);

    expect(article.daysUntilBodyPurge(in31Days)).toBeNull();
  });

  it("daysUntilBodyPurge counts down from 30", () => {
    const article = makeArticle();
    article.transitionTo(ContentStatus.REVIEW);
    article.transitionTo(ContentStatus.VALIDATED);
    article.transitionTo(ContentStatus.PUBLISHED);
    const in20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

    expect(article.daysUntilBodyPurge(in20Days)).toBe(10);
  });
});
