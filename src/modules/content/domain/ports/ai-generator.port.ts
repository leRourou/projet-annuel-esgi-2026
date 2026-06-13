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
  excerpt: string;
  suggestedKeywords: string[];
  slug: string;
}

export interface CuratedSource {
  id: string;
  title: string;
  link: string;
  summary: string;
}

export interface GenerateEnrichedContentInput extends GenerateContentInput {
  curatedSources: CuratedSource[];
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

export interface RegenerateSectionInput {
  articleTitle: string;
  fullBody: string;
  instruction: string;
  context?: string;
}

export interface AiGeneratorPort {
  generate(input: GenerateContentInput): Promise<GeneratedContent>;
  generateStream?(input: GenerateContentInput): AsyncIterable<string>;
  generateEnriched(input: GenerateEnrichedContentInput): Promise<GeneratedContent>;
  generateIdeas(input: GenerateIdeasInput): Promise<ContentIdea[]>;
  regenerateSection(input: RegenerateSectionInput): Promise<string>;
}
