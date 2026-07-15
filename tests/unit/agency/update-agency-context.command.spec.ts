import { UpdateAgencyContextCommand } from "@/modules/agency/application/commands/update-agency-context.command";
import { AgencyMember } from "@/modules/agency/domain/entities/agency-member.entity";
import { Agency } from "@/modules/agency/domain/entities/agency.entity";
import type { AgencyContextRepositoryPort } from "@/modules/agency/domain/ports/agency-context.repository.port";
import type { AgencyMemberRepositoryPort } from "@/modules/agency/domain/ports/agency-member.repository.port";
import type { AgencyRepositoryPort } from "@/modules/agency/domain/ports/agency.repository.port";
import { AgencyMemberRole } from "@/modules/agency/domain/value-objects/agency-member-role.vo";
import { beforeEach, describe, expect, it, vi } from "vitest";

const AGENCY_ID = "agency-uuid-1";
const USER_ID = "user-uuid-1";

function makeAdminMember(): AgencyMember {
  return AgencyMember.create("m-1", {
    agencyId: AGENCY_ID,
    userId: USER_ID,
    role: AgencyMemberRole.ADMIN,
    invitedBy: USER_ID,
  });
}

function makeAgency(): Agency {
  return Agency.create(AGENCY_ID, { name: "Test Agency", slug: "test-agency" });
}

function makeRepos(overrides?: {
  existingContext?: object | null;
  member?: AgencyMember | null;
  agency?: Agency | null;
}): {
  contextRepo: AgencyContextRepositoryPort;
  agencyRepo: AgencyRepositoryPort;
  memberRepo: AgencyMemberRepositoryPort;
} {
  const agencyValue = overrides && "agency" in overrides ? overrides.agency : makeAgency();
  const memberValue = overrides && "member" in overrides ? overrides.member : makeAdminMember();
  return {
    contextRepo: {
      findByAgencyId: vi.fn().mockResolvedValue(overrides?.existingContext ?? null),
      save: vi.fn().mockResolvedValue(undefined),
    },
    agencyRepo: {
      findById: vi.fn().mockResolvedValue(agencyValue),
      findByIds: vi.fn().mockResolvedValue([]),
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    memberRepo: {
      findByAgencyAndUser: vi.fn().mockResolvedValue(memberValue),
      findByInviteToken: vi.fn().mockResolvedValue(null),
      findAllByAgency: vi.fn().mockResolvedValue([]),
      findByUser: vi.fn().mockResolvedValue(null),
      findAllByUser: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

const BASE_INPUT = {
  agencyId: AGENCY_ID,
  requestingUserId: USER_ID,
  sector: "SaaS",
  targetAudience: "Marketing managers",
  toneOfVoice: "Professional",
  brandKeywords: ["growth", "ROI"],
  additionalContext: null,
};

describe("UpdateAgencyContextCommand", () => {
  let command: UpdateAgencyContextCommand;
  let contextRepo: AgencyContextRepositoryPort;
  let agencyRepo: AgencyRepositoryPort;
  let memberRepo: AgencyMemberRepositoryPort;

  beforeEach(() => {
    ({ contextRepo, agencyRepo, memberRepo } = makeRepos());
    command = new UpdateAgencyContextCommand(contextRepo, agencyRepo, memberRepo);
  });

  it("creates context when none exists", async () => {
    const result = await command.execute(BASE_INPUT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.sector).toBe("SaaS");
      expect(result.value.brandKeywords).toEqual(["growth", "ROI"]);
    }
    expect(contextRepo.save).toHaveBeenCalledOnce();
  });

  it("fails when agency not found", async () => {
    ({ contextRepo, agencyRepo, memberRepo } = makeRepos({ agency: null }));
    command = new UpdateAgencyContextCommand(contextRepo, agencyRepo, memberRepo);

    const result = await command.execute(BASE_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("fails when user is not an admin", async () => {
    const memberMember = AgencyMember.create("m-2", {
      agencyId: AGENCY_ID,
      userId: USER_ID,
      role: AgencyMemberRole.MEMBER,
      invitedBy: "other-user",
    });
    ({ contextRepo, agencyRepo, memberRepo } = makeRepos({ member: memberMember }));
    command = new UpdateAgencyContextCommand(contextRepo, agencyRepo, memberRepo);

    const result = await command.execute(BASE_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    }
  });

  it("updates context when it already exists", async () => {
    const { AgencyContext } = await import(
      "@/modules/agency/domain/entities/agency-context.entity"
    );
    const existing = AgencyContext.create("ctx-1", {
      agencyId: AGENCY_ID,
      sector: "Old sector",
      targetAudience: "Old audience",
      toneOfVoice: "Old tone",
      brandKeywords: [],
    });
    ({ contextRepo, agencyRepo, memberRepo } = makeRepos({ existingContext: existing }));
    command = new UpdateAgencyContextCommand(contextRepo, agencyRepo, memberRepo);

    const result = await command.execute({ ...BASE_INPUT, sector: "New sector" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.sector).toBe("New sector");
    }
    expect(contextRepo.save).toHaveBeenCalledOnce();
  });
});
