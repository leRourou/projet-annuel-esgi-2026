import {
  ScoreContentSeoQuery,
  summarizeSeoIssues,
} from "@/modules/content/application/queries/score-content-seo.query";
import { describe, expect, it } from "vitest";

const PERFECT_BODY = `# TypeScript Best Practices for 2024

Introduction paragraph with typescript keyword. TypeScript offers strong typing.

## Why TypeScript Matters

This section explains typescript importance in modern development. TypeScript is essential.

## Setting Up TypeScript

Setup guide for typescript projects. TypeScript configuration matters.

## Advanced TypeScript Patterns

More typescript patterns here. Developers use TypeScript daily.

### Generics in TypeScript

Deep dive into generics with practical examples.

#### Conditional Types

Very advanced typescript topic for experienced engineers.

## Conclusion

TypeScript is excellent for large-scale applications. Adopt TypeScript today.`.repeat(1);

const perfectInput = {
  title: "TypeScript Best Practices for 2024",
  body: PERFECT_BODY,
  seoMetadata: {
    metaTitle: "TypeScript Best Practices Guide 2024",
    metaDescription:
      "Learn the best TypeScript practices for modern web development. Complete guide for developers.",
    keywords: ["typescript", "best-practices", "guide"] as readonly string[],
    slug: "typescript-best-practices-2024",
    excerpt: "A comprehensive guide to TypeScript best practices for modern web development.",
  },
};

describe("ScoreContentSeoQuery", () => {
  const query = new ScoreContentSeoQuery();

  it("awards full score to a perfectly structured article", () => {
    const score = query.execute(perfectInput);
    expect(score.overall).toBe(100);
  });

  it("returns a breakdown summing to the overall score", () => {
    const score = query.execute(perfectInput);
    const sum = Object.values(score.breakdown).reduce((a, b) => a + b, 0);
    expect(sum).toBe(score.overall);
  });

  it("deducts h1 points when no H1 heading is present", () => {
    const input = {
      ...perfectInput,
      body: perfectInput.body.replace(/^# .+/m, "## Missing H1 replaced"),
    };
    const score = query.execute(input);
    expect(score.breakdown.h1).toBe(0);
    expect(score.overall).toBeLessThan(100);
  });

  it("deducts h2 points when fewer than 2 H2 headings are present", () => {
    const body =
      "# TypeScript Best Practices\n\nOnly one H2 below.\n\n## Single Section\n\nContent.";
    const score = query.execute({ ...perfectInput, body });
    expect(score.breakdown.h2).toBe(0);
  });

  it("deducts h3 points when no H3 heading is present", () => {
    const body = "# Title\n\n## Section 1\n\nContent.\n\n## Section 2\n\nContent.";
    const score = query.execute({ ...perfectInput, body });
    expect(score.breakdown.h3).toBe(0);
  });

  it("deducts metaTitle points when title is too long (>70 chars)", () => {
    const input = {
      ...perfectInput,
      seoMetadata: {
        ...perfectInput.seoMetadata,
        metaTitle: "A".repeat(71),
      },
    };
    const score = query.execute(input);
    expect(score.breakdown.metaTitle).toBe(0);
  });

  it("deducts metaTitle points when title is too short (<10 chars)", () => {
    const input = {
      ...perfectInput,
      seoMetadata: { ...perfectInput.seoMetadata, metaTitle: "Short" },
    };
    const score = query.execute(input);
    expect(score.breakdown.metaTitle).toBe(0);
  });

  it("deducts metaDescription points when too long (>160 chars)", () => {
    const input = {
      ...perfectInput,
      seoMetadata: {
        ...perfectInput.seoMetadata,
        metaDescription: "A".repeat(161),
      },
    };
    const score = query.execute(input);
    expect(score.breakdown.metaDescription).toBe(0);
  });

  it("deducts keywordInTitle points when primary keyword is absent from metaTitle", () => {
    const input = {
      ...perfectInput,
      seoMetadata: {
        ...perfectInput.seoMetadata,
        metaTitle: "An Article About Something Else Entirely",
      },
    };
    const score = query.execute(input);
    expect(score.breakdown.keywordInTitle).toBe(0);
  });

  it("deducts keywordInBody points when primary keyword appears fewer than 3 times", () => {
    const body =
      "# Rare keyword\n\n## Section 1\n\nFirst typescript mention.\n\n## Section 2\n\nNo more mentions here.\n\n## Section 3\n\nStill nothing. End.";
    const score = query.execute({ ...perfectInput, body });
    expect(score.breakdown.keywordInBody).toBe(0);
  });

  it("deducts wordCount points when body has fewer than 500 words", () => {
    const body =
      "# Short Title\n\n## Section A\n\nThis is short content.\n\n## Section B\n\nAlso short.\n\n### Sub\n\nDone.";
    const score = query.execute({ ...perfectInput, body });
    expect(score.breakdown.wordCount).toBe(0);
  });

  it("deducts excerpt points when excerpt is absent", () => {
    const input = {
      ...perfectInput,
      seoMetadata: { ...perfectInput.seoMetadata, excerpt: undefined },
    };
    const score = query.execute(input);
    expect(score.breakdown.excerpt).toBe(0);
  });

  it("exposes accurate detail counts", () => {
    const score = query.execute(perfectInput);
    expect(score.details.h1Count).toBe(1);
    expect(score.details.h2Count).toBeGreaterThanOrEqual(4);
    expect(score.details.h3Count).toBeGreaterThanOrEqual(1);
    expect(score.details.metaTitleLength).toBe(perfectInput.seoMetadata.metaTitle.length);
    expect(score.details.metaDescriptionLength).toBe(
      perfectInput.seoMetadata.metaDescription.length,
    );
  });

  it("handles an empty body gracefully returning 0 overall", () => {
    const input = {
      ...perfectInput,
      body: "",
    };
    const score = query.execute(input);
    expect(score.overall).toBeLessThan(50);
    expect(score.breakdown.h1).toBe(0);
    expect(score.breakdown.h2).toBe(0);
  });

  it("computes the primary keyword density as a percentage of total words", () => {
    const score = query.execute(perfectInput);
    const expectedDensity =
      Math.round(
        ((perfectInput.body.toLowerCase().match(/typescript/g) ?? []).length /
          score.details.wordCountValue) *
          10000,
      ) / 100;
    expect(score.details.keywordDensityPercent).toBe(expectedDensity);
  });

  it("reports 0 keyword density for an empty body", () => {
    const score = query.execute({ ...perfectInput, body: "" });
    expect(score.details.keywordDensityPercent).toBe(0);
  });

  describe("summarizeSeoIssues", () => {
    it("returns no issues for a perfect score", () => {
      const score = query.execute(perfectInput);
      expect(summarizeSeoIssues(score)).toEqual([]);
    });

    it("lists a human-readable issue for each zero-scoring breakdown item", () => {
      const score = query.execute({ ...perfectInput, body: "" });
      const issues = summarizeSeoIssues(score);
      expect(issues).toContain("Add a single clear H1 heading");
      expect(issues.length).toBeGreaterThan(0);
    });
  });
});
