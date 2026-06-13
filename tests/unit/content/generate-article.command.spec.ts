import { GenerateArticleCommand } from "@/modules/content/application/commands/generate-article.command";
import type {
  AiGeneratorPort,
  GeneratedContent,
} from "@/modules/content/domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerated: GeneratedContent = {
  title: "TypeScript Best Practices",
  body: "# TypeScript Best Practices\n\nContent here.",
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
    command = new GenerateArticleCommand(repo, ai);
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
});
