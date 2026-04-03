import Anthropic from "@anthropic-ai/sdk";
import type { AiGeneratorPort, GenerateContentInput, GeneratedContent } from "../../domain/ports/ai-generator.port";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function buildPrompt(input: GenerateContentInput): string {
  const typeLabels: Record<string, string> = {
    ARTICLE: "SEO article",
    PRODUCT_SHEET: "product sheet",
    META: "meta description",
  };
  const label = typeLabels[input.contentType] ?? "content";
  const wordTarget = input.wordCount ? ` of approximately ${input.wordCount} words` : "";

  return `You are an expert SEO content writer. Generate a ${label}${wordTarget} about the following topic.

Topic: ${input.topic}
Target keywords: ${input.keywords.join(", ")}
${input.tone ? `Tone: ${input.tone}` : ""}
${input.context ? `Additional context: ${input.context}` : ""}

Respond with a JSON object following this exact structure:
{
  "title": "The article title",
  "body": "The full content in markdown",
  "metaTitle": "SEO meta title (max 70 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "suggestedKeywords": ["keyword1", "keyword2"],
  "slug": "url-friendly-slug"
}

Only output the JSON object, nothing else.`;
}

export class AnthropicAiGeneratorAdapter implements AiGeneratorPort {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model = "claude-opus-4-6") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generate(input: GenerateContentInput): Promise<GeneratedContent> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in AI response");
    }

    try {
      const parsed = JSON.parse(textBlock.text) as GeneratedContent;
      return {
        ...parsed,
        slug: parsed.slug ?? slugify(parsed.title),
      };
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }
  }
}
