"use server";

import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { AddFeedInputSchema } from "@/modules/rss/application/commands/add-feed.command";
import { ListFeedItemsInputSchema } from "@/modules/rss/application/queries/list-feed-items.query";
import type { FeedItemDto } from "@/modules/rss/application/dto/feed-item.dto";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export async function addFeedAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = AddFeedInputSchema.safeParse({ ...(input as object), ownerId: session.user.id });
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const result = await container.addFeed.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: { id: result.value.id } };
}

export async function refreshFeedsAction(): Promise<
  ActionResult<{ refreshed: number; failed: number }>
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const stats = await container.refreshFeeds.execute();
  return { data: stats };
}

export async function listFeedItemsAction(
  feedId: string,
  limit = 50,
): Promise<ActionResult<FeedItemDto[]>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = ListFeedItemsInputSchema.safeParse({ feedId, limit });
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const items = await container.listFeedItems.execute(parsed.data);
  return { data: items };
}
