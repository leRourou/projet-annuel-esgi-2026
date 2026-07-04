"use server";

import { auth } from "@/lib/auth";
import type { ArticleDto } from "@/modules/content/application/dto/article.dto";
import { ExportToNotionInputSchema } from "@/modules/notion/application/commands/export-to-notion.command";
import { ImportFromNotionInputSchema } from "@/modules/notion/application/commands/import-from-notion.command";
import { SyncPageToNotionInputSchema } from "@/modules/notion/application/commands/sync-page-to-notion.command";
import type { NotionPageDto } from "@/modules/notion/application/dto/notion-page.dto";
import { SearchNotionPagesInputSchema } from "@/modules/notion/application/queries/search-notion-pages.query";
import { buildContainer } from "@/shared/infrastructure/di/container";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

async function getAgencyNotionToken(agencyId: string): Promise<string | null> {
  const container = await buildContainer();
  const result = await container.getAgency.execute({ agencyId });
  if (!result.success || !result.value.notionConnected) return null;
  // Access token is held in the domain entity; query exposes notionConnected flag.
  // We need the raw token — fetch it via the agency repository through a dedicated query.
  // For now use the container's agency repository indirectly via the raw agency DTO.
  // The token is not exposed in AgencyDto by design (security) — use a DB-level helper.
  return getAgencyNotionTokenFromDb(agencyId);
}

async function getAgencyNotionTokenFromDb(agencyId: string): Promise<string | null> {
  const { getDataSource } = await import("@/shared/infrastructure/database/data-source");
  const ds = await getDataSource();
  const rows = (await ds.query("SELECT notion_access_token FROM agencies WHERE id = $1 LIMIT 1", [
    agencyId,
  ])) as Array<{ notion_access_token: string | null }>;
  return rows[0]?.notion_access_token ?? null;
}

export async function exportToNotionAction(
  input: unknown,
): Promise<ActionResult<{ notionPageId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Notion account not connected. Connect Notion in Settings." };

  const agencyResult = await container.getAgency.execute({ agencyId: membership.agencyId });
  if (!agencyResult.success) return { error: "Agency not found" };
  const databaseId = agencyResult.value.notionDatabaseId;
  if (!databaseId) return { error: "No Notion database configured. Set it up in Settings." };

  const parsed = ExportToNotionInputSchema.safeParse({
    ...(input as object),
    accessToken: notionToken,
    parentDatabaseId: databaseId,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await container.exportToNotion.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function syncToNotionAction(
  input: unknown,
): Promise<ActionResult<{ notionPageId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Notion account not connected" };

  const parsed = SyncPageToNotionInputSchema.safeParse({
    ...(input as object),
    accessToken: notionToken,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await container.syncPageToNotion.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function importFromNotionAction(input: unknown): Promise<ActionResult<ArticleDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Notion account not connected" };

  const parsed = ImportFromNotionInputSchema.safeParse({
    ...(input as object),
    accessToken: notionToken,
    authorId: session.user.id,
    agencyId: membership.agencyId,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await container.importFromNotion.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function searchNotionPagesAction(
  query: string,
): Promise<ActionResult<NotionPageDto[]>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Notion account not connected" };

  const parsed = SearchNotionPagesInputSchema.safeParse({ query, accessToken: notionToken });
  if (!parsed.success) return { error: "Invalid input" };

  const pages = await container.searchNotionPages.execute(parsed.data);
  return { data: pages };
}
