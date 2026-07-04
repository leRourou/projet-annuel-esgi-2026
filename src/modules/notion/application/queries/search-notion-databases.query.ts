import { z } from "zod";
import type {
  NotionClientPort,
  NotionDatabaseSummary,
} from "../../domain/ports/notion-client.port";

export const SearchNotionDatabasesInputSchema = z.object({
  query: z.string().default(""),
  accessToken: z.string(),
});

export type SearchNotionDatabasesInput = z.infer<typeof SearchNotionDatabasesInputSchema>;

export class SearchNotionDatabasesQuery {
  constructor(private readonly notionClient: NotionClientPort) {}

  async execute(input: SearchNotionDatabasesInput): Promise<NotionDatabaseSummary[]> {
    return this.notionClient.searchDatabases(input);
  }
}
