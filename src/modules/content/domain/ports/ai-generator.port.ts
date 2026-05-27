import type { ContentTypeValue } from "../value-objects/content-type.vo";

export type ArticleType = "HOW_TO" | "LISTICLE" | "COMPARISON" | "CASE_STUDY" | "OPINION" | "NEWS";

export interface GenerateContentInput {
  contentType: ContentTypeValue;
  topic: string;
  keywords: string[];
  tone?: string;
  wordCount?: number;
  articleType?: ArticleType;
  context?: string;
}

export interface GeneratedContent {
  title: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  suggestedKeywords: string[];
  slug: string;
}

export interface GenerateIdeasInput {
  themes: string[];
  existingTitles?: string[];
  agencyContext?: string;
  count?: number;
}

export interface ContentIdea {
  title: string;
  angle: string;
  contentType: ContentTypeValue;
  keywords: string[];
}

export interface AiGeneratorPort {
  generate(input: GenerateContentInput): Promise<GeneratedContent>;
  generateStream?(input: GenerateContentInput): AsyncIterable<string>;
  generateIdeas(input: GenerateIdeasInput): Promise<ContentIdea[]>;
}
