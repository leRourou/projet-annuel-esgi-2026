import { CreateAgencyCommand } from "@/modules/agency/application/commands/create-agency.command";
import type { AgencyMemberRepositoryPort } from "@/modules/agency/domain/ports/agency-member.repository.port";
import type { AgencyRepositoryPort } from "@/modules/agency/domain/ports/agency.repository.port";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeRepos(): {
  agencyRepo: AgencyRepositoryPort;
  memberRepo: AgencyMemberRepositoryPort;
} {
  return {
    agencyRepo: {
      findById: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    memberRepo: {
      findByAgencyAndUser: vi.fn().mockResolvedValue(null),
      findByInviteToken: vi.fn().mockResolvedValue(null),
      findAllByAgency: vi.fn().mockResolvedValue([]),
      findByUser: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("CreateAgencyCommand", () => {
  let agencyRepo: AgencyRepositoryPort;
  let memberRepo: AgencyMemberRepositoryPort;
  let command: CreateAgencyCommand;

  beforeEach(() => {
    ({ agencyRepo, memberRepo } = makeRepos());
    command = new CreateAgencyCommand(agencyRepo, memberRepo);
  });

  it("creates agency and ADMIN membership for creator", async () => {
    const result = await command.execute({
      name: "Acme Agency",
      slug: "acme-agency",
      creatorUserId: "user-1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.name).toBe("Acme Agency");
      expect(result.value.slug).toBe("acme-agency");
      expect(result.value.memberCount).toBe(1);
    }
    expect(agencyRepo.save).toHaveBeenCalledOnce();
    expect(memberRepo.save).toHaveBeenCalledOnce();
  });

  it("fails when slug is already taken", async () => {
    vi.mocked(agencyRepo.findBySlug).mockResolvedValueOnce({} as never);
    const result = await command.execute({
      name: "Acme Agency",
      slug: "acme-agency",
      creatorUserId: "user-1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AGENCY_SLUG_TAKEN");
    }
  });

  it("fails when slug is invalid", async () => {
    const result = await command.execute({
      name: "Acme Agency",
      slug: "invalid slug!",
      creatorUserId: "user-1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_AGENCY_SLUG");
    }
  });
});
