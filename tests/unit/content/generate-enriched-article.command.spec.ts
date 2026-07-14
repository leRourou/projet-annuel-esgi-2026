import { GenerateEnrichedArticleCommand } from "@/modules/content/application/commands/generate-enriched-article.command";
import { ScoreContentSeoQuery } from "@/modules/content/application/queries/score-content-seo.query";
import type {
  AiGeneratorPort,
  GeneratedContent,
} from "@/modules/content/domain/ports/ai-generator.port";
import type { ArticleRepositoryPort } from "@/modules/content/domain/ports/article.repository.port";
import { FeedItem } from "@/modules/rss/domain/entities/feed-item.entity";
import type { FeedRepositoryPort } from "@/modules/rss/domain/ports/feed.repository.port";
import { CurationStatus } from "@/modules/rss/domain/value-objects/curation-status.vo";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A well-structured body so it scores above the auto-correction threshold by default —
// the dedicated auto-correction test below uses its own low-scoring body instead.
const GOOD_BODY = `# AI & Curated Sources: Best Practices

As noted in [Real Source](https://example.com), combining AI with real research changes everything.

## Why Curated Sources Matter

This section explains how curated sources make content trustworthy and specific.

## How the Enrichment Works

The AI weaves insights from real sources throughout the article, not just in one section.

### Citing Sources Properly

Each claim links back to its source using inline markdown links.

## Conclusion

Enriched AI content stands apart from generic AI output. Adopt this approach today.`;

const mockGenerated: GeneratedContent = {
  title: "AI & Curated Sources: Best Practices",
  body: GOOD_BODY,
  metaTitle: "AI & Curated Sources: Best Practices",
  metaDescription: "How to combine AI generation with real curated sources.",
  excerpt: "A guide to enriched AI content.",
  suggestedKeywords: ["ai", "content", "curation"],
  slug: "ai-curated-sources-best-practices",
};

function makeSourceItem(id: string) {
  return FeedItem.create(id, {
    feedId: "feed-1",
    title: `Source Article ${id}`,
    link: `https://example.com/${id}`,
    summary: "A relevant article about the topic.",
    publishedAt: new Date("2024-01-01"),
    curationStatus: CurationStatus.create("TO_USE"),
  });
}

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

function makeFeedRepo(items: ReturnType<typeof makeSourceItem>[] = []): FeedRepositoryPort {
  return {
    findById: vi.fn(),
    findAllByOwner: vi.fn(),
    findAllByAgency: vi.fn(),
    findAll: vi.fn(),
    saveFeed: vi.fn(),
    saveFeedItems: vi.fn(),
    saveFeedItem: vi.fn(),
    findItemsByFeedId: vi.fn(),
    findItemsByAgency: vi.fn().mockResolvedValue(items),
    findItemById: vi.fn(),
    findItemsByIds: vi.fn().mockResolvedValue(items),
    deleteFeed: vi.fn(),
  };
}

function makeAi(): AiGeneratorPort {
  return {
    generate: vi.fn(),
    generateEnriched: vi.fn().mockResolvedValue(mockGenerated),
    generateIdeas: vi.fn().mockResolvedValue([]),
    regenerateSection: vi.fn().mockResolvedValue(""),
  };
}

const baseInput = {
  topic: "AI and content creation",
  keywords: ["ai", "content"],
  contentType: "ARTICLE" as const,
  authorId: "550e8400-e29b-41d4-a716-446655440000",
  agencyId: "550e8400-e29b-41d4-a716-446655440001",
};

describe("GenerateEnrichedArticleCommand", () => {
  let repo: ArticleRepositoryPort;
  let ai: AiGeneratorPort;
  let command: GenerateEnrichedArticleCommand;

  describe("with curated TO_USE items available", () => {
    beforeEach(() => {
      const sources = [makeSourceItem("src-1"), makeSourceItem("src-2")];
      repo = makeRepo();
      ai = makeAi();
      command = new GenerateEnrichedArticleCommand(
        repo,
        ai,
        makeFeedRepo(sources),
        new ScoreContentSeoQuery(),
      );
    });

    it("generates and saves an article with sourceIds", async () => {
      const result = await command.execute(baseInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.title).toBe(mockGenerated.title);
        expect(result.value.status).toBe("DRAFT");
        expect(result.value.sourceIds).toHaveLength(2);
        expect(result.value.sourceIds).toContain("src-1");
        expect(result.value.sourceIds).toContain("src-2");
      }
    });

    it("calls generateEnriched with curated sources", async () => {
      await command.execute(baseInput);

      expect(ai.generateEnriched).toHaveBeenCalledOnce();
      const callArg = vi.mocked(ai.generateEnriched).mock.calls[0]?.[0];
      expect(callArg?.curatedSources).toHaveLength(2);
      expect(callArg?.curatedSources[0]?.id).toBe("src-1");
    });

    it("saves the article to the repository", async () => {
      await command.execute(baseInput);
      expect(repo.save).toHaveBeenCalledOnce();
    });

    it("auto-corrects when the initial draft scores below the threshold", async () => {
      const poorDraft: GeneratedContent = {
        title: "Weak draft",
        body: "Just a couple of sentences with no structure at all.",
        metaTitle: "Weak draft",
        metaDescription: "Too short.",
        excerpt: "",
        suggestedKeywords: ["ai"],
        slug: "weak-draft",
      };
      ai.generateEnriched = vi
        .fn()
        .mockResolvedValueOnce(poorDraft)
        .mockResolvedValueOnce(mockGenerated);

      const result = await command.execute(baseInput);

      expect(ai.generateEnriched).toHaveBeenCalledTimes(2);
      const secondCallArg = vi.mocked(ai.generateEnriched).mock.calls[1]?.[0];
      expect(secondCallArg?.context).toContain("SEO FIX REQUIRED");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.title).toBe(mockGenerated.title);
      }
    });
  });

  describe("with specific sourceIds provided", () => {
    it("fetches items by IDs instead of TO_USE query", async () => {
      const sources = [makeSourceItem("specific-1")];
      const feedRepo = makeFeedRepo(sources);
      repo = makeRepo();
      ai = makeAi();
      command = new GenerateEnrichedArticleCommand(repo, ai, feedRepo, new ScoreContentSeoQuery());

      const result = await command.execute({ ...baseInput, sourceIds: ["specific-1"] });

      expect(feedRepo.findItemsByIds).toHaveBeenCalledWith(["specific-1"]);
      expect(feedRepo.findItemsByAgency).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("with no curated sources", () => {
    beforeEach(() => {
      repo = makeRepo();
      ai = makeAi();
      command = new GenerateEnrichedArticleCommand(
        repo,
        ai,
        makeFeedRepo([]),
        new ScoreContentSeoQuery(),
      );
    });

    it("returns a failure when no TO_USE sources exist", async () => {
      const result = await command.execute(baseInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NO_CURATED_SOURCES");
      }
      expect(ai.generateEnriched).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
