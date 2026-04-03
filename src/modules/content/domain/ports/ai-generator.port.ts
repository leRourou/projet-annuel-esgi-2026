import type { ContentTypeValue } from "../value-objects/content-type.vo";

export interface GenerateContentInput {
  contentType: ContentTypeValue;
  topic: string;
  keywords: string[];
  tone?: string;
  wordCount?: number;
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

export interface AiGeneratorPort {
  generate(input: GenerateContentInput): Promise<GeneratedContent>;
}
