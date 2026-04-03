import { AgencyMember } from "@/modules/agency/domain/entities/agency-member.entity";
import { AgencyMemberRole } from "@/modules/agency/domain/value-objects/agency-member-role.vo";
import { describe, expect, it } from "vitest";

function makeMember(overrides: Partial<{ inviteToken: string; inviteExpiresAt: Date }> = {}) {
  return AgencyMember.create("member-1", {
    agencyId: "agency-1",
    userId: "user-1",
    role: AgencyMemberRole.MEMBER,
    invitedBy: "user-admin",
    ...overrides,
  });
}

describe("AgencyMember", () => {
  it("creates an active member (no invite token)", () => {
    const member = makeMember();
    expect(member.isPending).toBe(false);
    expect(member.joinedAt).toBeInstanceOf(Date);
    expect(member.inviteToken).toBeNull();
  });

  it("creates a pending member with invite token", () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const member = makeMember({ inviteToken: "abc123", inviteExpiresAt: expiresAt });
    expect(member.isPending).toBe(true);
    expect(member.joinedAt).toBeNull();
    expect(member.inviteToken).toBe("abc123");
  });

  it("accepts an invitation", () => {
    const member = makeMember({ inviteToken: "abc123" });
    member.accept();
    expect(member.isPending).toBe(false);
    expect(member.joinedAt).toBeInstanceOf(Date);
    expect(member.inviteToken).toBeNull();
  });

  it("detects expired invite token", () => {
    const pastDate = new Date(Date.now() - 1000);
    const member = makeMember({ inviteToken: "abc123", inviteExpiresAt: pastDate });
    expect(member.isInviteExpired()).toBe(true);
  });

  it("returns false for non-expired invite", () => {
    const futureDate = new Date(Date.now() + 1000);
    const member = makeMember({ inviteToken: "abc123", inviteExpiresAt: futureDate });
    expect(member.isInviteExpired()).toBe(false);
  });

  it("updates the role", () => {
    const member = makeMember();
    member.updateRole(AgencyMemberRole.VIEWER);
    expect(member.role.value).toBe("VIEWER");
  });
});
