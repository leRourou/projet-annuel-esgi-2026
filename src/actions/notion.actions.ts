"use server";

import { auth } from "@/lib/auth";
import type { AgencyDto } from "@/modules/agency/application/dto/agency.dto";
import type { ArticleDto } from "@/modules/content/application/dto/article.dto";
import { ExportToNotionInputSchema } from "@/modules/notion/application/commands/export-to-notion.command";
import { ImportFromNotionInputSchema } from "@/modules/notion/application/commands/import-from-notion.command";
import type { ImportNotionEntriesResult } from "@/modules/notion/application/commands/import-notion-entries.command";
import { SyncPageToNotionInputSchema } from "@/modules/notion/application/commands/sync-page-to-notion.command";
import type { NotionPageDto } from "@/modules/notion/application/dto/notion-page.dto";
import { SearchNotionPagesInputSchema } from "@/modules/notion/application/queries/search-notion-pages.query";
import type { NotionDatabaseSummary } from "@/modules/notion/domain/ports/notion-client.port";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { translateError } from "@/shared/lib/translate-error";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export async function getAgencyNotionToken(agencyId: string): Promise<string | null> {
  const container = await buildContainer();
  const result = await container.getAgency.execute({ agencyId });
  if (!result.success || !result.value.notionConnected) return null;
  // AgencyDto intentionally omits the raw access token (security). The container
  // does not expose a port for fetching it, so it is read directly here.
  // TODO(architecture): expose an agencyRepository.getNotionAccessToken port so this
  // can go through the domain layer instead of a raw query.
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
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken)
    return { error: "Compte Notion non connecté. Connectez Notion dans les paramètres." };

  const agencyResult = await container.getAgency.execute({ agencyId: membership.agencyId });
  if (!agencyResult.success) return { error: "Agence introuvable." };
  const databaseId = agencyResult.value.notionDatabaseId;
  if (!databaseId)
    return { error: "Aucune base Notion configurée. Configurez-la dans les paramètres." };

  const parsed = ExportToNotionInputSchema.safeParse({
    ...(input as object),
    accessToken: notionToken,
    parentDatabaseId: databaseId,
  });
  if (!parsed.success) return { error: "Saisie invalide." };

  const result = await container.exportToNotion.execute(parsed.data);
  if (!result.success) return { error: translateError(result.error) };
  return { data: result.value };
}

export async function syncToNotionAction(
  input: unknown,
): Promise<ActionResult<{ notionPageId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Compte Notion non connecté." };

  const parsed = SyncPageToNotionInputSchema.safeParse({
    ...(input as object),
    accessToken: notionToken,
  });
  if (!parsed.success) return { error: "Saisie invalide." };

  const result = await container.syncPageToNotion.execute(parsed.data);
  if (!result.success) return { error: translateError(result.error) };
  return { data: result.value };
}

export async function importFromNotionAction(input: unknown): Promise<ActionResult<ArticleDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Compte Notion non connecté." };

  const parsed = ImportFromNotionInputSchema.safeParse({
    ...(input as object),
    accessToken: notionToken,
    authorId: session.user.id,
    agencyId: membership.agencyId,
  });
  if (!parsed.success) return { error: "Saisie invalide." };

  const result = await container.importFromNotion.execute(parsed.data);
  if (!result.success) return { error: translateError(result.error) };
  return { data: result.value };
}

export async function searchNotionPagesAction(
  query: string,
): Promise<ActionResult<NotionPageDto[]>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Compte Notion non connecté." };

  const parsed = SearchNotionPagesInputSchema.safeParse({ query, accessToken: notionToken });
  if (!parsed.success) return { error: "Saisie invalide." };

  const pages = await container.searchNotionPages.execute(parsed.data);
  return { data: pages };
}

export async function searchNotionDatabasesAction(
  query: string,
): Promise<ActionResult<NotionDatabaseSummary[]>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Compte Notion non connecté." };

  const databases = await container.searchNotionDatabases.execute({
    query,
    accessToken: notionToken,
  });
  return { data: databases };
}

export async function testNotionConnectionAction(): Promise<
  ActionResult<{ ok: boolean; error?: string }>
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { data: { ok: false, error: "Compte Notion non connecté." } };

  const testResult = await container.notionClient.testConnection(notionToken);
  return { data: testResult };
}

export async function updateAgencyNotionConfigAction(
  databaseId: string,
): Promise<ActionResult<AgencyDto>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };
  if (membership.role === "VIEWER") return { error: "Accès refusé." };

  const result = await container.updateAgencyNotionConfig.execute({
    agencyId: membership.agencyId,
    databaseId,
  });
  if (!result.success) return { error: translateError(result.error) };
  return { data: result.value };
}

export async function importNotionEntriesAction(
  databaseId: string,
): Promise<ActionResult<ImportNotionEntriesResult>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const notionToken = await getAgencyNotionToken(membership.agencyId);
  if (!notionToken) return { error: "Compte Notion non connecté." };

  const result = await container.importNotionEntries.execute({
    agencyId: membership.agencyId,
    ownerId: session.user.id,
    accessToken: notionToken,
    databaseId,
  });
  if (!result.success) return { error: translateError(result.error) };
  return { data: result.value };
}
