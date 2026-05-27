import Anthropic from "@anthropic-ai/sdk";
import type {
  AiGeneratorPort,
  ContentIdea,
  GenerateContentInput,
  GenerateIdeasInput,
  GeneratedContent,
} from "../../domain/ports/ai-generator.port";

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
    LINKEDIN_POST: "LinkedIn post",
    FACEBOOK_POST: "Facebook post",
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

  async *generateStream(input: GenerateContentInput): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }

  async generateIdeas(input: GenerateIdeasInput): Promise<ContentIdea[]> {
    const count = input.count ?? 10;
    const themesText = input.themes.join(", ");
    const existingSection =
      input.existingTitles && input.existingTitles.length > 0
        ? `\nAlready covered topics (avoid strict duplicates, but complementary angles are welcome):\n${input.existingTitles.map((t) => `- ${t}`).join("\n")}`
        : "";
    const contextSection = input.agencyContext ? `\nAgency context: ${input.agencyContext}` : "";

    const prompt = `You are an expert content strategist specializing in SEO and digital marketing.

Generate exactly ${count} high-quality content ideas for an agency whose themes are: ${themesText}.${contextSection}${existingSection}

For each idea, think about:
- Search intent (informational, commercial, navigational)
- SEO potential and keyword opportunities
- Uniqueness of angle vs. generic content
- Value for the target audience

Respond with a JSON array of exactly ${count} objects with this structure:
[
  {
    "title": "Compelling, SEO-optimized title",
    "angle": "Unique editorial angle in 1-2 sentences explaining what makes this idea distinctive",
    "contentType": "ARTICLE",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

contentType must be one of: ARTICLE, PRODUCT_SHEET, META.
Only output the JSON array, nothing else.`;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in AI response");
    }

    try {
      const parsed = JSON.parse(textBlock.text) as ContentIdea[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new Error("Failed to parse AI ideas response as JSON");
    }
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
