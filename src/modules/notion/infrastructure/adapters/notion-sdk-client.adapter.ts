import { Client } from "@notionhq/client";
import type { NotionClientPort, SearchNotionPagesInput, CreateNotionPageInput } from "../../domain/ports/notion-client.port";
import type { NotionPage } from "../../domain/entities/notion-page.entity";
import { NotionPageMapper } from "../mappers/notion-page.mapper";

export class NotionSdkClientAdapter implements NotionClientPort {
  private getClient(accessToken: string): Client {
    return new Client({ auth: accessToken });
  }

  async searchPages(input: SearchNotionPagesInput): Promise<NotionPage[]> {
    const client = this.getClient(input.accessToken);
    const response = await client.search({
      query: input.query,
      filter: { property: "object", value: "page" },
    });

    const pages = await Promise.all(
      response.results.map(async (result) => {
        const blocksResponse = await client.blocks.children.list({ block_id: result.id });
        return NotionPageMapper.toDomain(
          result as Parameters<typeof NotionPageMapper.toDomain>[0],
          blocksResponse.results as Parameters<typeof NotionPageMapper.toDomain>[1],
        );
      }),
    );
    return pages;
  }

  async getPage(pageId: string, accessToken: string): Promise<NotionPage> {
    const client = this.getClient(accessToken);
    const [page, blocksResponse] = await Promise.all([
      client.pages.retrieve({ page_id: pageId }),
      client.blocks.children.list({ block_id: pageId }),
    ]);
    return NotionPageMapper.toDomain(
      page as Parameters<typeof NotionPageMapper.toDomain>[0],
      blocksResponse.results as Parameters<typeof NotionPageMapper.toDomain>[1],
    );
  }

  async createPage(input: CreateNotionPageInput): Promise<NotionPage> {
    const client = this.getClient(input.accessToken);
    const page = await client.pages.create({
      parent: { database_id: input.parentDatabaseId },
      properties: {
        title: {
          title: [{ text: { content: input.title } }],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: input.content } }],
          },
        },
      ],
    });
    return this.getPage(page.id, input.accessToken);
  }

  async updatePage(pageId: string, content: string, accessToken: string): Promise<void> {
    const client = this.getClient(accessToken);
    // Clear existing blocks then add new content
    const existing = await client.blocks.children.list({ block_id: pageId });
    await Promise.all(existing.results.map((b) => client.blocks.delete({ block_id: b.id })));
    await client.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content } }],
          },
        },
      ],
    });
  }
}
