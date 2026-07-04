export interface SeoScoreInput {
  title: string;
  body: string;
  seoMetadata: {
    metaTitle: string;
    metaDescription: string;
    keywords: readonly string[];
    slug: string;
    excerpt?: string;
  };
}

export interface SeoScoreBreakdown {
  h1: number;
  h2: number;
  h3: number;
  metaTitle: number;
  metaDescription: number;
  keywordInTitle: number;
  keywordInBody: number;
  wordCount: number;
  excerpt: number;
}

export interface SeoScoreDetails {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  metaTitleLength: number;
  metaDescriptionLength: number;
  wordCountValue: number;
  keywordDensityPercent: number;
}

export interface SeoScore {
  overall: number;
  breakdown: SeoScoreBreakdown;
  details: SeoScoreDetails;
}

const WEIGHTS: SeoScoreBreakdown = {
  h1: 15,
  h2: 15,
  h3: 10,
  metaTitle: 15,
  metaDescription: 10,
  keywordInTitle: 15,
  keywordInBody: 10,
  wordCount: 5,
  excerpt: 5,
};

export class ScoreContentSeoQuery {
  execute(input: SeoScoreInput): SeoScore {
    const { body, seoMetadata } = input;
    const { metaTitle, metaDescription, keywords, excerpt } = seoMetadata;

    const h1Count = (body.match(/^# .+/gm) ?? []).length;
    const h2Count = (body.match(/^## .+/gm) ?? []).length;
    const h3Count = (body.match(/^### .+/gm) ?? []).length;

    const rawWords = body.split(/\s+/).filter((w) => w.length > 0);
    const wordCountValue = rawWords.length;

    const primaryKeyword = (keywords[0] ?? "").toLowerCase();
    const bodyLower = body.toLowerCase();
    const keywordBodyMatches = primaryKeyword
      ? (
          bodyLower.match(new RegExp(primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ??
          []
        ).length
      : 0;

    const breakdown: SeoScoreBreakdown = {
      h1: h1Count >= 1 ? WEIGHTS.h1 : 0,
      h2: h2Count >= 2 ? WEIGHTS.h2 : 0,
      h3: h3Count >= 1 ? WEIGHTS.h3 : 0,
      metaTitle: metaTitle.length >= 10 && metaTitle.length <= 70 ? WEIGHTS.metaTitle : 0,
      metaDescription: metaDescription.length <= 160 ? WEIGHTS.metaDescription : 0,
      keywordInTitle:
        primaryKeyword && metaTitle.toLowerCase().includes(primaryKeyword)
          ? WEIGHTS.keywordInTitle
          : 0,
      keywordInBody: keywordBodyMatches >= 3 ? WEIGHTS.keywordInBody : 0,
      wordCount: wordCountValue >= 50 ? WEIGHTS.wordCount : 0,
      excerpt: excerpt && excerpt.length > 0 ? WEIGHTS.excerpt : 0,
    };

    const overall = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
    const keywordDensityPercent =
      wordCountValue > 0 ? Math.round((keywordBodyMatches / wordCountValue) * 10000) / 100 : 0;

    return {
      overall,
      breakdown,
      details: {
        h1Count,
        h2Count,
        h3Count,
        metaTitleLength: metaTitle.length,
        metaDescriptionLength: metaDescription.length,
        wordCountValue,
        keywordDensityPercent,
      },
    };
  }
}

const ISSUE_DESCRIPTIONS: Record<keyof SeoScoreBreakdown, string> = {
  h1: "Add a single clear H1 heading",
  h2: "Add at least 2 H2 section headings",
  h3: "Add at least 1 H3 sub-heading",
  metaTitle: "Meta title must be between 10 and 70 characters",
  metaDescription: "Meta description must be at most 160 characters",
  keywordInTitle: "The primary keyword must appear in the meta title",
  keywordInBody: "The primary keyword must appear at least 3 times in the body",
  wordCount: "The body is too short — add more substantial content",
  excerpt: "Add a short excerpt summarizing the content",
};

export function summarizeSeoIssues(score: SeoScore): string[] {
  return (Object.keys(score.breakdown) as Array<keyof SeoScoreBreakdown>)
    .filter((key) => score.breakdown[key] === 0)
    .map((key) => ISSUE_DESCRIPTIONS[key]);
}
