import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export const EXPORT_FORMATS = ["MARKDOWN", "HTML", "TEXT"] as const;

export type ExportFormatValue = (typeof EXPORT_FORMATS)[number];

interface ExportFormatProps {
  readonly value: ExportFormatValue;
  readonly extension: string;
  readonly mimeType: string;
}

const FORMAT_META: Record<ExportFormatValue, { extension: string; mimeType: string }> = {
  MARKDOWN: { extension: "md", mimeType: "text/markdown" },
  HTML: { extension: "html", mimeType: "text/html" },
  TEXT: { extension: "txt", mimeType: "text/plain" },
};

export class ExportFormat extends ValueObject<ExportFormatProps> {
  static readonly MARKDOWN = new ExportFormat({ value: "MARKDOWN", ...FORMAT_META.MARKDOWN });
  static readonly HTML = new ExportFormat({ value: "HTML", ...FORMAT_META.HTML });
  static readonly TEXT = new ExportFormat({ value: "TEXT", ...FORMAT_META.TEXT });

  private constructor(props: ExportFormatProps) {
    super(props);
  }

  static create(value: string): ExportFormat {
    if (!EXPORT_FORMATS.includes(value as ExportFormatValue)) {
      throw new DomainError(`"${value}" is not a valid export format`, "INVALID_EXPORT_FORMAT");
    }
    return new ExportFormat({
      value: value as ExportFormatValue,
      ...FORMAT_META[value as ExportFormatValue],
    });
  }

  get value(): ExportFormatValue {
    return this.props.value;
  }

  get extension(): string {
    return this.props.extension;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }
}
