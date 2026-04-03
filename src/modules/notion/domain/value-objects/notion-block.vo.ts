import { ValueObject } from "@/shared/domain/base/value-object.base";

export type NotionBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "code"
  | "image";

interface NotionBlockProps {
  readonly type: NotionBlockType;
  readonly text: string;
}

export class NotionBlock extends ValueObject<NotionBlockProps> {
  private constructor(props: NotionBlockProps) {
    super(props);
  }

  static create(type: NotionBlockType, text: string): NotionBlock {
    return new NotionBlock({ type, text });
  }

  get type(): NotionBlockType {
    return this.props.type;
  }

  get text(): string {
    return this.props.text;
  }
}
