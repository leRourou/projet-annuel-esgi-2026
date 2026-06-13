import { CreateArticleCommand } from "@/modules/content/application/commands/create-article.command";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { describe, expect, it, vi } from "vitest";

function makeRepo(): ArticleRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
  };
}

const validInput = {
  title: "TypeScript Best Practices",
  body: "## Introduction\n\nContent here.",
  metaTitle: "TypeScript Best Practices 2025",
  metaDescription: "Learn the top TypeScript best practices to write clean, maintainable code.",
  slug: "typescript-best-practices",
  suggestedKeywords: ["typescript", "clean code"],
  contentType: "ARTICLE" as const,
  authorId: "00000000-0000-0000-0000-000000000001",
  agencyId: "00000000-0000-0000-0000-000000000002",
};

describe("CreateArticleCommand", () => {
  it("creates and saves an article with DRAFT status", async () => {
    const repo = makeRepo();
    const command = new CreateArticleCommand(repo);

    const result = await command.execute(validInput);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.status).toBe("DRAFT");
    expect(result.value.title).toBe("TypeScript Best Practices");
    expect(result.value.contentType).toBe("ARTICLE");
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it("saves SEO metadata correctly", async () => {
    const repo = makeRepo();
    const command = new CreateArticleCommand(repo);

    const result = await command.execute(validInput);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.seoMetadata.slug).toBe("typescript-best-practices");
    expect(result.value.seoMetadata.keywords).toEqual(["typescript", "clean code"]);
  });

  it("returns failure when title is empty", async () => {
    const repo = makeRepo();
    const command = new CreateArticleCommand(repo);

    const result = await command.execute({ ...validInput, title: "  " });

    expect(result.success).toBe(false);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
