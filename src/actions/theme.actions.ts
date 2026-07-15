"use server";

import { auth } from "@/lib/auth";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { getActiveAgencyId } from "@/shared/lib/active-agency";
import { z } from "zod";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

const CreateThemeSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function createThemeAction(
  input: unknown,
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = CreateThemeSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid theme name" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.createTheme.execute({
    name: parsed.data.name,
    agencyId: membership.agencyId,
    requestingUserId: session.user.id,
  });
  if (!result.success) return { error: result.error.message };
  return { data: { id: result.value.id, name: result.value.name } };
}

export async function deleteThemeAction(themeId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.deleteTheme.execute({
    themeId,
    agencyId: membership.agencyId,
    requestingUserId: session.user.id,
  });
  if (!result.success) return { error: result.error.message };
  return { data: undefined };
}

export async function listThemesAction(): Promise<
  ActionResult<Array<{ id: string; name: string }>>
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(
    session.user.id,
    await getActiveAgencyId(),
  );
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const themes = await container.listThemes.execute(membership.agencyId);
  return { data: themes.map((t) => ({ id: t.id, name: t.name })) };
}
