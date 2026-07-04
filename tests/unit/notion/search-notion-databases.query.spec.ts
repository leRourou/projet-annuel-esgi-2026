import { SearchNotionDatabasesQuery } from "@/modules/notion/application/queries/search-notion-databases.query";
import type { NotionClientPort } from "@/modules/notion/domain/ports/notion-client.port";
import { describe, expect, it, vi } from "vitest";

function makeNotionClient(): NotionClientPort {
  return {
    searchPages: vi.fn(),
    getPage: vi.fn(),
    createPage: vi.fn(),
    updatePage: vi.fn(),
    exportPage: vi.fn(),
    searchDatabases: vi
      .fn()
      .mockResolvedValue([
        { id: "db-1", title: "Veille concurrence", url: "https://notion.so/db-1" },
      ]),
    getDatabase: vi.fn(),
    queryDatabase: vi.fn(),
    setPageStatus: vi.fn(),
    updatePageSchedule: vi.fn(),
    testConnection: vi.fn(),
  };
}

describe("SearchNotionDatabasesQuery", () => {
  it("returns databases matching the query", async () => {
    const notionClient = makeNotionClient();
    const query = new SearchNotionDatabasesQuery(notionClient);

    const result = await query.execute({ query: "veille", accessToken: "token" });

    expect(result).toEqual([
      { id: "db-1", title: "Veille concurrence", url: "https://notion.so/db-1" },
    ]);
    expect(notionClient.searchDatabases).toHaveBeenCalledWith({
      query: "veille",
      accessToken: "token",
    });
  });
});
