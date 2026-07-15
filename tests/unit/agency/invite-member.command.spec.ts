import { InviteMemberCommand } from "@/modules/agency/application/commands/invite-member.command";
import type { AgencyMemberRepositoryPort } from "@/modules/agency/domain/ports/agency-member.repository.port";
import { User } from "@/modules/auth/domain/entities/user.entity";
import type { UserRepositoryPort } from "@/modules/auth/domain/ports/user.repository.port";
import { Email } from "@/modules/auth/domain/value-objects/email.vo";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeUser() {
  return User.create("user-2", { email: Email.create("bob@test.com"), name: "Bob" });
}

function makeRepos(): {
  memberRepo: AgencyMemberRepositoryPort;
  userRepo: UserRepositoryPort;
} {
  return {
    memberRepo: {
      findByAgencyAndUser: vi.fn().mockResolvedValue(null),
      findByInviteToken: vi.fn().mockResolvedValue(null),
      findAllByAgency: vi.fn().mockResolvedValue([]),
      findByUser: vi.fn().mockResolvedValue(null),
      findAllByUser: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    userRepo: {
      findById: vi.fn().mockResolvedValue(null),
      findByIds: vi.fn().mockResolvedValue([]),
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("InviteMemberCommand", () => {
  let memberRepo: AgencyMemberRepositoryPort;
  let userRepo: UserRepositoryPort;
  let command: InviteMemberCommand;

  beforeEach(() => {
    ({ memberRepo, userRepo } = makeRepos());
    command = new InviteMemberCommand(memberRepo, userRepo);
  });

  it("creates a pending invite for an existing user", async () => {
    const result = await command.execute({
      agencyId: "agency-1",
      inviterUserId: "user-1",
      inviterRole: "ADMIN",
      targetEmail: "bob@test.com",
      role: "MEMBER",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.member.isPending).toBe(true);
      expect(result.value.member.role).toBe("MEMBER");
      expect(result.value.inviteToken).toBeTruthy();
    }
    expect(memberRepo.save).toHaveBeenCalledOnce();
  });

  it("fails when inviter does not have invite permission", async () => {
    const result = await command.execute({
      agencyId: "agency-1",
      inviterUserId: "user-1",
      inviterRole: "MEMBER",
      targetEmail: "bob@test.com",
      role: "VIEWER",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    }
  });

  it("fails when target user does not exist", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValueOnce(null);
    const result = await command.execute({
      agencyId: "agency-1",
      inviterUserId: "user-1",
      inviterRole: "ADMIN",
      targetEmail: "unknown@test.com",
      role: "MEMBER",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("USER_NOT_FOUND");
    }
  });

  it("fails when user is already a member", async () => {
    vi.mocked(memberRepo.findByAgencyAndUser).mockResolvedValueOnce({} as never);
    const result = await command.execute({
      agencyId: "agency-1",
      inviterUserId: "user-1",
      inviterRole: "ADMIN",
      targetEmail: "bob@test.com",
      role: "MEMBER",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("MEMBER_ALREADY_EXISTS");
    }
  });
});
