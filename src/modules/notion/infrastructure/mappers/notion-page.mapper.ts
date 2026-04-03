import { NotionPage } from "../../domain/entities/notion-page.entity";
import { NotionBlock, type NotionBlockType } from "../../domain/value-objects/notion-block.vo";

type NotionApiBlock = {
  id: string;
  type: string;
  [key: string]: unknown;
};

type NotionApiPage = {
  id: string;
  url: string;
  parent?: { database_id?: string };
  last_edited_time: string;
  properties: {
    title?: { title?: Array<{ plain_text: string }> };
    Name?: { title?: Array<{ plain_text: string }> };
    [key: string]: unknown;
  };
};

const SUPPORTED_TYPES: NotionBlockType[] = [
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "bulleted_list_item",
  "numbered_list_item",
  "code",
];

export class NotionPageMapper {
  static toDomain(page: NotionApiPage, blocks: NotionApiBlock[]): NotionPage {
    const titleArr = page.properties["title"]?.title ?? page.properties["Name"]?.title ?? [];
    const title = titleArr.map((t) => t.plain_text).join("") || "Untitled";

    const domainBlocks = blocks
      .filter((b) => SUPPORTED_TYPES.includes(b.type as NotionBlockType))
      .map((b) => {
        const blockContent = b[b.type] as { rich_text?: Array<{ plain_text: string }> } | undefined;
        const text = blockContent?.rich_text?.map((rt) => rt.plain_text).join("") ?? "";
        return NotionBlock.create(b.type as NotionBlockType, text);
      });

    return NotionPage.create(page.id, {
      title,
      blocks: domainBlocks,
      url: page.url,
      databaseId: page.parent?.database_id,
      lastEditedAt: new Date(page.last_edited_time),
    });
  }
}
