import { ExportFormat } from "@/modules/content/domain/value-objects/export-format.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

describe("ExportFormat", () => {
  it("creates all valid formats", () => {
    expect(ExportFormat.create("MARKDOWN").value).toBe("MARKDOWN");
    expect(ExportFormat.create("HTML").value).toBe("HTML");
    expect(ExportFormat.create("TEXT").value).toBe("TEXT");
  });

  it("throws on invalid format", () => {
    expect(() => ExportFormat.create("PDF")).toThrow(DomainError);
    expect(() => ExportFormat.create("")).toThrow(DomainError);
  });

  it("exposes the file extension for each format", () => {
    expect(ExportFormat.MARKDOWN.extension).toBe("md");
    expect(ExportFormat.HTML.extension).toBe("html");
    expect(ExportFormat.TEXT.extension).toBe("txt");
  });

  it("exposes the mime type for each format", () => {
    expect(ExportFormat.MARKDOWN.mimeType).toBe("text/markdown");
    expect(ExportFormat.HTML.mimeType).toBe("text/html");
    expect(ExportFormat.TEXT.mimeType).toBe("text/plain");
  });
});
