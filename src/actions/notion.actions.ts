"use server";

import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { SyncPageToNotionInputSchema } from "@/modules/notion/application/commands/sync-page-to-notion.command";
import { ImportFromNotionInputSchema } from "@/modules/notion/application/commands/import-from-notion.command";
import { SearchNotionPagesInputSchema } from "@/modules/notion/application/queries/search-notion-pages.query";
import type { NotionPageDto } from "@/modules/notion/application/dto/notion-page.dto";
import type { ArticleDto } from "@/modules/content/application/dto/article.dto";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

function getNotionToken(session: { notionAccessToken?: string }): string | null {
  return session.notionAccessToken ?? null;
}

export async function syncToNotionAction(
  input: unknown,
): Promise<ActionResult<{ notionPageId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const notionToken = getNotionToken(session as typeof session & { notionAccessToken?: string });
  if (!notionToken) return { error: "Notion account not connected" };

  const parsed = SyncPageToNotionInputSchema.safeParse({ ...(input as object), accessToken: notionToken });
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const result = await container.syncPageToNotion.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function importFromNotionAction(
  input: unknown,
): Promise<ActionResult<ArticleDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const notionToken = getNotionToken(session as typeof session & { notionAccessToken?: string });
  if (!notionToken) return { error: "Notion account not connected" };

  const parsed = ImportFromNotionInputSchema.safeParse({
    ...(input as object),
    accessToken: notionToken,
    authorId: session.user.id,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const result = await container.importFromNotion.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function searchNotionPagesAction(
  query: string,
): Promise<ActionResult<NotionPageDto[]>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const notionToken = getNotionToken(session as typeof session & { notionAccessToken?: string });
  if (!notionToken) return { error: "Notion account not connected" };

  const parsed = SearchNotionPagesInputSchema.safeParse({ query, accessToken: notionToken });
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const pages = await container.searchNotionPages.execute(parsed.data);
  return { data: pages };
}
