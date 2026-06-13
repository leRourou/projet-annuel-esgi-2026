"use server";

import { auth } from "@/lib/auth";
import { AddFeedInputSchema } from "@/modules/rss/application/commands/add-feed.command";
import { QualifyFeedItemInputSchema } from "@/modules/rss/application/commands/qualify-feed-item.command";
import type { FeedItemDto } from "@/modules/rss/application/dto/feed-item.dto";
import type { FeedDto } from "@/modules/rss/application/dto/feed.dto";
import { ListCuratedItemsInputSchema } from "@/modules/rss/application/queries/list-curated-items.query";
import { ListFeedItemsInputSchema } from "@/modules/rss/application/queries/list-feed-items.query";
import type { CurationStatusValue } from "@/modules/rss/domain/value-objects/curation-status.vo";
import { buildContainer } from "@/shared/infrastructure/di/container";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

async function requireSession(): Promise<{ user: { id: string } } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as { user: { id: string } };
}

export async function addFeedAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };
  if (membership.role === "VIEWER") return { error: "Insufficient permissions" };

  const parsed = AddFeedInputSchema.safeParse({
    ...(input as object),
    ownerId: session.user.id,
    agencyId: membership.agencyId,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await container.addFeed.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: { id: result.value.id } };
}

export async function refreshFeedsAction(): Promise<
  ActionResult<{ refreshed: number; failed: number }>
> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const stats = await container.refreshFeeds.execute();
  return { data: stats };
}

export async function listFeedsAction(): Promise<ActionResult<FeedDto[]>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const feeds = await container.listFeeds.execute(membership.agencyId);
  return { data: feeds };
}

export async function listFeedItemsAction(
  feedId: string,
  limit = 50,
): Promise<ActionResult<FeedItemDto[]>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const parsed = ListFeedItemsInputSchema.safeParse({ feedId, limit });
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const items = await container.listFeedItems.execute(parsed.data);
  return { data: items };
}

export async function listCuratedItemsAction(filters?: {
  curationStatus?: CurationStatusValue;
  tagId?: string;
  limit?: number;
}): Promise<ActionResult<FeedItemDto[]>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const parsed = ListCuratedItemsInputSchema.safeParse({
    agencyId: membership.agencyId,
    ...filters,
  });
  if (!parsed.success) return { error: "Invalid filters" };

  const items = await container.listCuratedItems.execute(parsed.data);
  return { data: items };
}

export async function qualifyFeedItemAction(
  itemId: string,
  status: CurationStatusValue,
  tagIds?: string[],
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const parsed = QualifyFeedItemInputSchema.safeParse({ itemId, status, tagIds });
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const result = await container.qualifyFeedItem.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: undefined };
}
