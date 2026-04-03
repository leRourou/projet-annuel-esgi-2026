"use server";

import { auth } from "@/lib/auth";
import type { AgencyDto, AgencyMemberDto } from "@/modules/agency/application/dto/agency.dto";
import { buildContainer } from "@/shared/infrastructure/di/container";

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
  const existing = await container.getUserMembership.execute(session.user.id);
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
  const membership = await container.getUserMembership.execute(session.user.id);
  if (!membership || membership.isPending) return { error: "No active agency membership" };

  const result = await container.getAgency.execute({ agencyId: membership.agencyId });
  if (!result.success) return { error: result.error.message };
  return { data: result.value };
}

export async function listMembersAction(): Promise<ActionResult<AgencyMemberDto[]>> {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" };

  const container = await buildContainer();
  const membership = await container.getUserMembership.execute(session.user.id);
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
  const membership = await container.getUserMembership.execute(session.user.id);
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
  const membership = await container.getUserMembership.execute(session.user.id);
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
  const membership = await container.getUserMembership.execute(session.user.id);
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
