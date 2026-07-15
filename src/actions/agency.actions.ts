"use server";

import { auth } from "@/lib/auth";
import { UpdateAgencyContextInputSchema } from "@/modules/agency/application/commands/update-agency-context.command";
import type { AgencyContextDto } from "@/modules/agency/application/dto/agency-context.dto";
import type { AgencyDto, AgencyMemberDto } from "@/modules/agency/application/dto/agency.dto";
import { buildContainer } from "@/shared/infrastructure/di/container";
import { ACTIVE_AGENCY_COOKIE, getActiveAgencyId } from "@/shared/lib/active-agency";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

async function requireSession(): Promise<{ user: { id: string } } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as { user: { id: string } };
}

export async function createAgencyAction(input: {
  name: string;
  slug: string;
}): Promise<ActionResult<AgencyDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const existing = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (existing) return { error: "You already belong to an agency" };

  const result = await container.createAgency.execute({
    name: input.name,
    slug: input.slug,
    creatorUserId: session.user.id,
  });
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function getAgencyAction(): Promise<ActionResult<AgencyDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.getAgency.execute({ agencyId: membership.agencyId });
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function listMembersAction(): Promise<ActionResult<AgencyMemberDto[]>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const members = await container.listMembers.execute({ agencyId: membership.agencyId });
  return { data: members };
}

export async function inviteMemberAction(input: {
  targetEmail: string;
  role: string;
}): Promise<ActionResult<{ inviteToken: string }>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.inviteMember.execute({
    agencyId: membership.agencyId,
    inviterUserId: session.user.id,
    inviterRole: membership.role,
    targetEmail: input.targetEmail,
    role: input.role,
  });
  if (!result.success) return { error: result.error.message };
  return { data: { inviteToken: result.value.inviteToken } };
}

export async function acceptInviteAction(token: string): Promise<ActionResult<AgencyMemberDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const result = await container.acceptInvite.execute({ token, userId: session.user.id });
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function updateMemberRoleAction(input: {
  targetUserId: string;
  newRole: string;
}): Promise<ActionResult<AgencyMemberDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.updateMemberRole.execute({
    agencyId: membership.agencyId,
    actorUserId: session.user.id,
    actorRole: membership.role,
    targetUserId: input.targetUserId,
    newRole: input.newRole,
  });
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function removeMemberAction(targetUserId: string): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.removeMember.execute({
    agencyId: membership.agencyId,
    actorUserId: session.user.id,
    actorRole: membership.role,
    targetUserId,
  });
  if (!result.success) return { error: result.error.message };
  return { data: undefined };
}

export async function getAgencyContextAction(): Promise<ActionResult<AgencyContextDto | null>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const context = await container.getAgencyContext.execute(membership.agencyId);
  return { data: context };
}

export async function updateAgencyContextAction(
  input: unknown,
): Promise<ActionResult<AgencyContextDto>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id, await getActiveAgencyId());
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const parsed = UpdateAgencyContextInputSchema.safeParse({
    ...(input as object),
    agencyId: membership.agencyId,
    requestingUserId: session.user.id,
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0] ?? "Invalid input";
    return { error: firstError };
  }

  const result = await container.updateAgencyContext.execute(parsed.data);
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function listUserAgenciesAction(): Promise<
  ActionResult<{ agencyId: string; agencyName: string; role: string }[]>
> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const agencies = await container.listUserAgencies.execute(session.user.id);
  return { data: agencies };
}

export async function switchAgencyAction(agencyId: string): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const agencies = await container.listUserAgencies.execute(session.user.id);
  if (!agencies.some((a) => a.agencyId === agencyId)) {
    return { error: "You are not a member of this agency" };
  }

  const store = await cookies();
  store.set(ACTIVE_AGENCY_COOKIE, agencyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/content");
}
