import { Entity } from "@/shared/domain/base/entity.base";
import type { NotionBlock } from "../value-objects/notion-block.vo";

export interface NotionPageProps {
  title: string;
  blocks: NotionBlock[];
  url: string;
  databaseId?: string;
  lastEditedAt: Date;
}

export class NotionPage extends Entity<string> {
  private constructor(
    id: string,
    private readonly props: NotionPageProps,
  ) {
    super(id);
  }

  static create(id: string, props: NotionPageProps): NotionPage {
    return new NotionPage(id, props);
  }

  get title(): string {
    return this.props.title;
  }

  get blocks(): NotionBlock[] {
    return this.props.blocks;
  }

  get url(): string {
    return this.props.url;
  }

  get databaseId(): string | undefined {
    return this.props.databaseId;
  }

  get lastEditedAt(): Date {
    return this.props.lastEditedAt;
  }

  toMarkdown(): string {
    return this.props.blocks
      .map((block) => {
        switch (block.type) {
          case "heading_1":
            return `# ${block.text}`;
          case "heading_2":
            return `## ${block.text}`;
          case "heading_3":
            return `### ${block.text}`;
          case "bulleted_list_item":
            return `- ${block.text}`;
          case "numbered_list_item":
            return `1. ${block.text}`;
          default:
            return block.text;
        }
      })
      .join("\n\n");
  }
}
