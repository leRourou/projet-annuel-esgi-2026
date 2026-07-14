import { GenerateArticleCommand } from "@/modules/content/application/commands/generate-article.command";
import { ScoreContentSeoQuery } from "@/modules/content/application/queries/score-content-seo.query";
import type {
  AiGeneratorPort,
  GeneratedContent,
} from "@/modules/content/domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A well-structured body so it scores above the auto-correction threshold by default —
// tests that need to exercise auto-correction use their own low-scoring body instead.
const GOOD_BODY = `# TypeScript Best Practices for 2024

Introduction paragraph with typescript keyword. TypeScript offers strong typing.

## Why TypeScript Matters

This section explains typescript importance in modern development. TypeScript is essential.

## Setting Up TypeScript

Setup guide for typescript projects. TypeScript configuration matters.

### Generics in TypeScript

Deep dive into generics with practical examples.

## Conclusion

TypeScript is excellent for large-scale applications. Adopt TypeScript today.`;

const mockGenerated: GeneratedContent = {
  title: "TypeScript Best Practices",
  body: GOOD_BODY,
  metaTitle: "TypeScript Best Practices Guide",
  metaDescription: "Learn the best TypeScript practices for modern development.",
  excerpt: "A practical guide to TypeScript best practices for modern development.",
  suggestedKeywords: ["typescript", "best-practices"],
  slug: "typescript-best-practices",
};

function makeRepo(): ArticleRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    findScheduled: vi.fn().mockResolvedValue([]),
    findPublishedBefore: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeAi(): AiGeneratorPort {
  return {
    generate: vi.fn().mockResolvedValue(mockGenerated),
    generateEnriched: vi.fn().mockResolvedValue(mockGenerated),
    generateIdeas: vi.fn().mockResolvedValue([]),
    regenerateSection: vi.fn().mockResolvedValue(""),
  };
}

describe("GenerateArticleCommand", () => {
  let repo: ArticleRepositoryPort;
  let ai: AiGeneratorPort;
  let command: GenerateArticleCommand;

  beforeEach(() => {
    repo = makeRepo();
    ai = makeAi();
    command = new GenerateArticleCommand(repo, ai, new ScoreContentSeoQuery());
  });

  it("generates and saves an article", async () => {
    const result = await command.execute({
      topic: "TypeScript best practices",
      keywords: ["typescript"],
      contentType: "ARTICLE",
      authorId: "550e8400-e29b-41d4-a716-446655440000",
      agencyId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.title).toBe(mockGenerated.title);
      expect(result.value.status).toBe("DRAFT");
    }
    expect(ai.generate).toHaveBeenCalledOnce();
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it("forwards language and articleType to the AI generator", async () => {
    await command.execute({
      topic: "TypeScript best practices",
      keywords: ["typescript"],
      contentType: "ARTICLE",
      articleType: "HOW_TO",
      language: "EN",
      authorId: "550e8400-e29b-41d4-a716-446655440000",
      agencyId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(ai.generate).toHaveBeenCalledWith(
      expect.objectContaining({ articleType: "HOW_TO", language: "EN" }),
    );
  });

  it("auto-corrects and re-scores when the initial draft scores below the threshold", async () => {
    const poorDraft: GeneratedContent = {
      title: "Weak draft",
      body: "Just a couple of sentences with no structure at all.",
      metaTitle: "Weak draft",
      metaDescription: "Too short.",
      excerpt: "",
      suggestedKeywords: ["typescript"],
      slug: "weak-draft",
    };
    ai.generate = vi.fn().mockResolvedValueOnce(poorDraft).mockResolvedValueOnce(mockGenerated);
    command = new GenerateArticleCommand(repo, ai, new ScoreContentSeoQuery());

    const result = await command.execute({
      topic: "TypeScript best practices",
      keywords: ["typescript"],
      contentType: "ARTICLE",
      authorId: "550e8400-e29b-41d4-a716-446655440000",
      agencyId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(ai.generate).toHaveBeenCalledTimes(2);
    const secondCallArg = vi.mocked(ai.generate).mock.calls[1]?.[0];
    expect(secondCallArg?.context).toContain("SEO FIX REQUIRED");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.title).toBe(mockGenerated.title);
    }
  });

  it("keeps the original draft when the corrected version does not score higher", async () => {
    const poorDraft: GeneratedContent = {
      title: "Weak draft",
      body: "Just a couple of sentences with no structure at all.",
      metaTitle: "Weak draft",
      metaDescription: "Too short.",
      excerpt: "",
      suggestedKeywords: ["typescript"],
      slug: "weak-draft",
    };
    ai.generate = vi.fn().mockResolvedValue(poorDraft);
    command = new GenerateArticleCommand(repo, ai, new ScoreContentSeoQuery());

    const result = await command.execute({
      topic: "TypeScript best practices",
      keywords: ["typescript"],
      contentType: "ARTICLE",
      authorId: "550e8400-e29b-41d4-a716-446655440000",
      agencyId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(ai.generate).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.title).toBe(poorDraft.title);
    }
  });
});
