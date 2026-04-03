import { z } from "zod";
import type { NotionClientPort } from "../../domain/ports/notion-client.port";
import { type NotionPageDto, toNotionPageDto } from "../dto/notion-page.dto";

export const SearchNotionPagesInputSchema = z.object({
  query: z.string().min(1),
  accessToken: z.string(),
  databaseId: z.string().optional(),
});

export type SearchNotionPagesInput = z.infer<typeof SearchNotionPagesInputSchema>;

export class SearchNotionPagesQuery {
  constructor(private readonly notionClient: NotionClientPort) {}

  async execute(input: SearchNotionPagesInput): Promise<NotionPageDto[]> {
    const pages = await this.notionClient.searchPages({
      query: input.query,
      accessToken: input.accessToken,
      databaseId: input.databaseId,
    });
    return pages.map(toNotionPageDto);
  }
}
