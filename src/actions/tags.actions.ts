"use server";

import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { z } from "zod";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
});

const AssignTagsSchema = z.object({
  articleId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

export async function createTagAction(
  input: unknown,
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = CreateTagSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid tag name" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.createTag.execute({
    name: parsed.data.name,
    agencyId: membership.agencyId,
    requestingUserId: session.user.id,
  });
  if (!result.success) return { error: result.error.message };
  return { data: { id: result.value.id, name: result.value.name } };
}

export async function deleteTagAction(tagId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.deleteTag.execute({
    tagId,
    agencyId: membership.agencyId,
    requestingUserId: session.user.id,
  });
  if (!result.success) return { error: result.error.message };
  return { data: undefined };
}

export async function listTagsAction(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const tags = await container.listTags.execute(membership.agencyId);
  return { data: tags.map((t) => ({ id: t.id, name: t.name })) };
}

export async function assignTagsAction(input: unknown): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = AssignTagsSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const container = await buildContainer();
  const result = await container.assignTags.execute({
    articleId: parsed.data.articleId,
    tagIds: parsed.data.tagIds,
  });
  if (!result.success) return { error: result.error.message };
  return { data: undefined };
}
