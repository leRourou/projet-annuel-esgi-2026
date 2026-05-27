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

const ARTICLE_TYPE_INSTRUCTIONS: Record<string, string> = {
  HOW_TO: `FORMAT: How-to guide / Tutorial
- Step-by-step numbered structure (use ### for each step)
- Start with prerequisites or "What you'll need"
- Each step must be actionable and specific
- End with expected outcome and troubleshooting tips`,
  LISTICLE: `FORMAT: List article
- Numbered or bulleted list of items (minimum 7 items)
- Each item has a bold H3 title + 2–4 sentences of explanation
- Items ordered by importance or logic
- Introduction and conclusion frame the list`,
  COMPARISON: `FORMAT: Comparison article
- Compare at least 2 options head-to-head
- Use a summary comparison table (markdown table) early in the article
- Dedicated H2 section per option: strengths, weaknesses, best for
- Clear recommendation at the end based on use case`,
  CASE_STUDY: `FORMAT: Case study
- Structure: Context → Challenge → Solution → Results
- Use specific names, numbers, timelines (or realistic fictional examples)
- Quote-style callouts for key insights
- Actionable takeaways section at the end`,
  OPINION: `FORMAT: Opinion / Thought leadership
- Strong thesis stated in the first paragraph
- Back every claim with data, examples, or logical argument
- Address the counterargument and refute it
- End with a call to action or challenge to the reader`,
  NEWS: `FORMAT: News / Announcement
- Inverted pyramid: most important info first
- Answer Who, What, When, Where, Why in the first 2 paragraphs
- Include context/background (H2 section)
- Quote or statement from a relevant source (real or illustrative)
- Implications or next steps section`,
};

function buildArticlePrompt(input: GenerateContentInput): string {
  const wordTarget = input.wordCount
    ? `The article must be approximately ${input.wordCount} words.`
    : "The article must be 1000–1500 words (pillar content depth).";
  const toneLine = input.tone
    ? `Tone of voice: ${input.tone}.`
    : "Tone: authoritative yet accessible.";
  const contextLine = input.context ? `\nBusiness context: ${input.context}` : "";
  const primaryKw = input.keywords[0] ?? input.topic;
  const secondaryKws = input.keywords.slice(1).join(", ");
  const articleTypeInstructions = input.articleType
    ? `\n${ARTICLE_TYPE_INSTRUCTIONS[input.articleType] ?? ""}`
    : "";

  return `You are a senior SEO content strategist. Your task is to write an exceptional blog article that outperforms generic AI-generated content.

ASSIGNMENT
Topic: ${input.topic}
Primary keyword: ${primaryKw}
Secondary keywords: ${secondaryKws || "none"}
${toneLine}
${wordTarget}${contextLine}
${articleTypeInstructions}
STRUCTURE REQUIREMENTS (mandatory)
1. H1 title: compelling, includes primary keyword, under 65 chars
2. Introduction (150–200 words): strong hook, problem statement, reader benefit
3. At least 4 H2 sections with substantive content:
   - Each H2 must address a specific angle or sub-problem
   - Use H3 sub-headings to break down complex points
   - Include concrete examples, actionable advice, or real data
4. Conclusion (100 words): key takeaways + clear next step
5. Optional: a short FAQ (2–3 Q&A) if the topic warrants it

SEO REQUIREMENTS (mandatory)
- Primary keyword in: H1, first paragraph, at least 2 H2 headings, conclusion
- Secondary keywords distributed naturally (not stuffed)
- Meta title ≤ 70 chars, must include primary keyword
- Meta description ≤ 160 chars, must summarize value and include primary keyword
- Slug: lowercase, hyphen-separated, 3–6 words

QUALITY STANDARDS
- Zero filler. Every sentence must add value.
- Use specific numbers, percentages, or named examples where relevant
- Prefer active voice
- No vague generalities ("It is important to…", "Many experts say…")

OUTPUT FORMAT — respond with ONLY this JSON object, no markdown wrapper:
{
  "title": "H1 title here",
  "body": "Full article in markdown (use ## for H2, ### for H3)",
  "metaTitle": "SEO meta title ≤70 chars",
  "metaDescription": "SEO meta description ≤160 chars",
  "suggestedKeywords": ["primary-kw", "secondary-kw-1", "secondary-kw-2"],
  "slug": "url-friendly-slug"
}`;
}

function buildSocialPrompt(input: GenerateContentInput): string {
  const isLinkedIn = input.contentType === "LINKEDIN_POST";
  const platform = isLinkedIn ? "LinkedIn" : "Facebook";
  const toneLine = input.tone
    ? `Tone: ${input.tone}.`
    : `Tone: ${isLinkedIn ? "professional and insightful" : "engaging and community-oriented"}.`;
  const contextLine = input.context ? `\nBusiness context: ${input.context}` : "";
  const primaryKw = input.keywords[0] ?? input.topic;

  return `You are a ${platform} content specialist who writes high-performing posts.

ASSIGNMENT
Topic: ${input.topic}
Primary keyword: ${primaryKw}
${toneLine}${contextLine}

POST STRUCTURE (mandatory)
${
  isLinkedIn
    ? `1. HOOK (first line): bold statement, surprising stat, or provocative question — must stop the scroll
2. SETUP (1–2 short paragraphs): context and problem
3. INSIGHT (2–3 short paragraphs): your perspective, a specific example, or a numbered list
4. CTA (last line): a question or clear next step to drive engagement
- Use line breaks generously (short paragraphs)
- 150–300 words total
- 3–5 relevant hashtags at the end`
    : `1. HOOK (first line): relatable situation or question
2. BODY (2–4 short paragraphs): story, tip, or insight with a personal angle
3. CTA: invite comments or shares
- Conversational tone, 100–200 words
- Minimal hashtags (2–3 max)`
}

OUTPUT FORMAT — respond with ONLY this JSON object:
{
  "title": "Post subject line (internal label, not shown publicly)",
  "body": "Full post text",
  "metaTitle": "Post topic ≤70 chars",
  "metaDescription": "One-sentence summary of the post ≤160 chars",
  "suggestedKeywords": ["keyword1", "keyword2"],
  "slug": "topic-slug"
}`;
}

function buildProductSheetPrompt(input: GenerateContentInput): string {
  const toneLine = input.tone ? `Tone: ${input.tone}.` : "Tone: conversion-focused, benefit-led.";
  const contextLine = input.context ? `\nProduct context: ${input.context}` : "";
  const primaryKw = input.keywords[0] ?? input.topic;

  return `You are a conversion copywriter specializing in SEO product pages.

ASSIGNMENT
Product/Service: ${input.topic}
Primary keyword: ${primaryKw}
Secondary keywords: ${input.keywords.slice(1).join(", ") || "none"}
${toneLine}${contextLine}

STRUCTURE (mandatory)
1. H1: product name + primary benefit, includes primary keyword
2. Hero description (60–80 words): what it is, who it's for, primary benefit
3. Key features section (H2 + bullet list): 4–6 features described as benefits, not specs
4. Why choose us / Differentiators (H2): 3 concrete differentiators
5. Use cases (H2): 2–3 specific scenarios
6. CTA paragraph: direct, action-oriented

SEO REQUIREMENTS
- Primary keyword in H1 and first paragraph
- Meta title ≤ 70 chars
- Meta description ≤ 160 chars (include primary keyword + main benefit)

OUTPUT FORMAT — respond with ONLY this JSON object:
{
  "title": "Product/service H1 title",
  "body": "Full product sheet in markdown",
  "metaTitle": "SEO meta title ≤70 chars",
  "metaDescription": "SEO meta description ≤160 chars",
  "suggestedKeywords": ["kw1", "kw2", "kw3"],
  "slug": "product-slug"
}`;
}

function buildMetaPrompt(input: GenerateContentInput): string {
  const primaryKw = input.keywords[0] ?? input.topic;

  return `You are an SEO specialist. Generate optimized meta tags for the following page.

Page topic: ${input.topic}
Primary keyword: ${primaryKw}
Secondary keywords: ${input.keywords.slice(1).join(", ") || "none"}
${input.context ? `Context: ${input.context}` : ""}

REQUIREMENTS
- metaTitle: compelling, includes primary keyword, ≤ 70 chars, no brand suffix
- metaDescription: summarizes page value, includes primary keyword, ≤ 160 chars, includes implicit CTA
- body: a 150-word summary of the page content the meta tags describe

OUTPUT FORMAT — respond with ONLY this JSON object:
{
  "title": "Page title",
  "body": "150-word page summary",
  "metaTitle": "SEO meta title ≤70 chars",
  "metaDescription": "SEO meta description ≤160 chars",
  "suggestedKeywords": ["kw1", "kw2", "kw3"],
  "slug": "page-slug"
}`;
}

function buildPrompt(input: GenerateContentInput): string {
  switch (input.contentType) {
    case "LINKEDIN_POST":
    case "FACEBOOK_POST":
      return buildSocialPrompt(input);
    case "PRODUCT_SHEET":
      return buildProductSheetPrompt(input);
    case "META":
      return buildMetaPrompt(input);
    default:
      return buildArticlePrompt(input);
  }
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
