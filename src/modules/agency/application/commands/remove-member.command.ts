import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import {
  InsufficientPermissionsError,
  MemberNotFoundError,
} from "../../domain/errors/agency.errors";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import { AgencyMemberRole } from "../../domain/value-objects/agency-member-role.vo";

export interface RemoveMemberInput {
  agencyId: string;
  actorUserId: string;
  actorRole: string;
  targetUserId: string;
}

export class RemoveMemberCommand {
  constructor(private readonly memberRepository: AgencyMemberRepositoryPort) {}

  async execute(input: RemoveMemberInput): Promise<Result<void, DomainError>> {
    try {
      const actorRole = AgencyMemberRole.create(input.actorRole);
      if (!actorRole.canManageMembers()) {
        return Result.fail(new InsufficientPermissionsError());
      }

      const member = await this.memberRepository.findByAgencyAndUser(
        input.agencyId,
        input.targetUserId,
      );
      if (!member) {
        return Result.fail(new MemberNotFoundError(input.targetUserId));
      }

      if (member.role.isAdmin()) {
        return Result.fail(new InsufficientPermissionsError());
      }

      await this.memberRepository.delete(input.agencyId, input.targetUserId);
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
