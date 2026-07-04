import { Client, isNotionClientError } from "@notionhq/client";
import type {
  BlockObjectRequest,
  CreatePageParameters,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { NotionPage } from "../../domain/entities/notion-page.entity";
import type {
  CreateNotionPageInput,
  ExportPageInput,
  NotionClientPort,
  NotionDatabaseEntry,
  NotionDatabaseSummary,
  QueryNotionDatabaseInput,
  SearchNotionDatabasesInput,
  SearchNotionPagesInput,
  TestConnectionResult,
} from "../../domain/ports/notion-client.port";
import { markdownToNotionBlocks } from "../../domain/value-objects/markdown-to-notion-blocks";
import { NotionPageMapper } from "../mappers/notion-page.mapper";

type NotionRichText = { plain_text: string };
type NotionTitleProperty = { type: "title"; title: NotionRichText[] };

function extractTitle(properties: Record<string, unknown>): string {
  const titleProp = Object.values(properties).find(
    (prop): prop is NotionTitleProperty =>
      typeof prop === "object" && prop !== null && (prop as { type?: string }).type === "title",
  );
  return titleProp?.title.map((t) => t.plain_text).join("") || "Untitled";
}

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

  async exportPage(input: ExportPageInput): Promise<NotionPage> {
    const client = this.getClient(input.accessToken);

    type NotionProperties = CreatePageParameters["properties"];
    const properties: NotionProperties = {
      title: {
        title: [{ text: { content: input.title } }],
      },
    };

    if (input.status) {
      properties.Status = { select: { name: input.status } };
    }
    if (input.contentType) {
      properties.Type = { select: { name: input.contentType } };
    }
    if (input.tags && input.tags.length > 0) {
      properties.Tags = {
        multi_select: input.tags.map((tag) => ({ name: tag })),
      };
    }
    if (input.scheduledAt) {
      const dateStr = input.scheduledAt.toISOString().split("T")[0] as string;
      properties["Publication date"] = {
        date: { start: dateStr },
      };
    }

    const blocks = markdownToNotionBlocks(input.body);
    const richText = (text: string) => [{ type: "text" as const, text: { content: text } }];
    const children: BlockObjectRequest[] = blocks.map((block) => {
      switch (block.type) {
        case "heading_1":
          return {
            object: "block",
            type: "heading_1",
            heading_1: { rich_text: richText(block.text) },
          };
        case "heading_2":
          return {
            object: "block",
            type: "heading_2",
            heading_2: { rich_text: richText(block.text) },
          };
        case "heading_3":
          return {
            object: "block",
            type: "heading_3",
            heading_3: { rich_text: richText(block.text) },
          };
        case "bulleted_list_item":
          return {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: { rich_text: richText(block.text) },
          };
        case "numbered_list_item":
          return {
            object: "block",
            type: "numbered_list_item",
            numbered_list_item: { rich_text: richText(block.text) },
          };
        default:
          return {
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: richText(block.text) },
          };
      }
    });

    const page = await client.pages.create({
      parent: { database_id: input.parentDatabaseId },
      properties,
      children,
    });

    return this.getPage(page.id, input.accessToken);
  }

  async searchDatabases(input: SearchNotionDatabasesInput): Promise<NotionDatabaseSummary[]> {
    const client = this.getClient(input.accessToken);
    const response = await client.search({
      query: input.query,
      filter: { property: "object", value: "database" },
    });

    return response.results.map((result) => {
      const db = result as { id: string; url: string; title?: NotionRichText[] };
      return {
        id: db.id,
        title: db.title?.map((t) => t.plain_text).join("") || "Untitled",
        url: db.url,
      };
    });
  }

  async getDatabase(databaseId: string, accessToken: string): Promise<NotionDatabaseSummary> {
    const client = this.getClient(accessToken);
    const db = (await client.databases.retrieve({ database_id: databaseId })) as {
      id: string;
      url: string;
      title?: NotionRichText[];
    };
    return {
      id: db.id,
      title: db.title?.map((t) => t.plain_text).join("") || "Untitled",
      url: db.url,
    };
  }

  async queryDatabase(input: QueryNotionDatabaseInput): Promise<NotionDatabaseEntry[]> {
    const client = this.getClient(input.accessToken);
    const response = await client.databases.query({ database_id: input.databaseId });

    return (response.results as PageObjectResponse[]).map((page) => ({
      id: page.id,
      title: extractTitle(page.properties),
      url: page.url,
      lastEditedAt: new Date(page.last_edited_time),
    }));
  }

  async setPageStatus(pageId: string, status: string, accessToken: string): Promise<void> {
    const client = this.getClient(accessToken);
    await client.pages.update({
      page_id: pageId,
      properties: {
        "Curation Status": { select: { name: status } },
      },
    });
  }

  async updatePageSchedule(pageId: string, date: Date, accessToken: string): Promise<void> {
    const client = this.getClient(accessToken);
    const dateStr = date.toISOString().split("T")[0] as string;
    await client.pages.update({
      page_id: pageId,
      properties: {
        "Publication date": { date: { start: dateStr } },
      },
    });
  }

  async testConnection(accessToken: string): Promise<TestConnectionResult> {
    const client = this.getClient(accessToken);
    try {
      await client.users.me({});
      return { ok: true };
    } catch (error) {
      if (isNotionClientError(error)) {
        if (error.code === "unauthorized" || error.code === "restricted_resource") {
          return {
            ok: false,
            error: "Notion access token is invalid or expired. Please reconnect Notion.",
          };
        }
        return { ok: false, error: error.message };
      }
      return { ok: false, error: "Unable to reach Notion. Please try again." };
    }
  }
}
