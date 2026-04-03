import { z } from "zod";
import type { NotionPage } from "../../domain/entities/notion-page.entity";

export const NotionPageDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  databaseId: z.string().optional(),
  lastEditedAt: z.date(),
  markdownContent: z.string(),
});

export type NotionPageDto = z.infer<typeof NotionPageDtoSchema>;

export function toNotionPageDto(page: NotionPage): NotionPageDto {
  return {
    id: page.id,
    title: page.title,
    url: page.url,
    databaseId: page.databaseId,
    lastEditedAt: page.lastEditedAt,
    markdownContent: page.toMarkdown(),
  };
}
