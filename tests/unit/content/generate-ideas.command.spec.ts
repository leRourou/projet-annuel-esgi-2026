import { GenerateIdeasCommand } from "@/modules/content/application/commands/generate-ideas.command";
import type {
  AiGeneratorPort,
  ContentIdea,
} from "@/modules/content/domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { describe, expect, it, vi } from "vitest";

function makeIdea(title: string): ContentIdea {
  return { title, angle: "A great angle", contentType: "ARTICLE", keywords: ["kw1"] };
}

function makeMocks() {
  const aiGenerator: AiGeneratorPort = {
    generate: vi.fn(),
    generateEnriched: vi.fn(),
    generateIdeas: vi.fn().mockResolvedValue([makeIdea("Idea 1"), makeIdea("Idea 2")]),
    regenerateSection: vi.fn().mockResolvedValue(""),
  };
  const articleRepository: ArticleRepositoryPort = {
    findById: vi.fn(),
    findAll: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 200, totalPages: 0 }),
    findScheduled: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  return { aiGenerator, articleRepository };
}

describe("GenerateIdeasCommand", () => {
  it("returns ideas from AI", async () => {
    const { aiGenerator, articleRepository } = makeMocks();
    const command = new GenerateIdeasCommand(aiGenerator, articleRepository);

    const result = await command.execute({
      agencyId: "agency-1",
      themes: ["SEO", "Marketing"],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value).toHaveLength(2);
    expect(result.value[0]?.title).toBe("Idea 1");
  });

  it("passes existing article titles to AI for anti-duplication", async () => {
    const { aiGenerator, articleRepository } = makeMocks();
    const existingArticle = { title: "Existing Article" };
    vi.mocked(articleRepository.findAll).mockResolvedValue({
      items: [existingArticle as never],
      total: 1,
      page: 1,
      limit: 200,
      totalPages: 1,
    });

    const command = new GenerateIdeasCommand(aiGenerator, articleRepository);
    await command.execute({ agencyId: "agency-1", themes: ["SEO"] });

    expect(aiGenerator.generateIdeas).toHaveBeenCalledWith(
      expect.objectContaining({ existingTitles: ["Existing Article"] }),
    );
  });

  it("passes themes and context to AI", async () => {
    const { aiGenerator, articleRepository } = makeMocks();
    const command = new GenerateIdeasCommand(aiGenerator, articleRepository);

    await command.execute({
      agencyId: "agency-1",
      themes: ["SEO", "Branding"],
      agencyContext: "B2B SaaS company",
    });

    expect(aiGenerator.generateIdeas).toHaveBeenCalledWith(
      expect.objectContaining({
        themes: ["SEO", "Branding"],
        agencyContext: "B2B SaaS company",
      }),
    );
  });
});
