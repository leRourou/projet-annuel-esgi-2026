"use server";

import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { translateError } from "@/shared/lib/translate-error";
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
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const parsed = CreateTagSchema.safeParse(input);
  if (!parsed.success) return { error: "Nom de tag invalide." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const result = await container.createTag.execute({
    name: parsed.data.name,
    agencyId: membership.agencyId,
    requestingUserId: session.user.id,
  });
  if (!result.success) return { error: translateError(result.error) };
  return { data: { id: result.value.id, name: result.value.name } };
}

export async function deleteTagAction(tagId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const result = await container.deleteTag.execute({
    tagId,
    agencyId: membership.agencyId,
    requestingUserId: session.user.id,
  });
  if (!result.success) return { error: translateError(result.error) };
  return { data: undefined };
}

export async function listTagsAction(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const tags = await container.listTags.execute(membership.agencyId);
  return { data: tags.map((t) => ({ id: t.id, name: t.name })) };
}

export async function assignTagsAction(input: unknown): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous devez être connecté." };

  const parsed = AssignTagsSchema.safeParse(input);
  if (!parsed.success) return { error: "Saisie invalide." };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "Aucune agence active." };

  const article = await container.getArticle.execute(parsed.data.articleId);
  if (!article.success) return { error: translateError(article.error) };
  if (article.value.agencyId !== membership.agencyId) return { error: "Accès refusé." };

  const result = await container.assignTags.execute({
    articleId: parsed.data.articleId,
    tagIds: parsed.data.tagIds,
  });
  if (!result.success) return { error: translateError(result.error) };
  return { data: undefined };
}
