import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import {
  InsufficientPermissionsError,
  MemberNotFoundError,
} from "../../domain/errors/agency.errors";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import { AgencyMemberRole } from "../../domain/value-objects/agency-member-role.vo";
import type { AgencyMemberDto } from "../dto/agency.dto";

export interface UpdateMemberRoleInput {
  agencyId: string;
  actorUserId: string;
  actorRole: string;
  targetUserId: string;
  newRole: string;
}

export class UpdateMemberRoleCommand {
  constructor(private readonly memberRepository: AgencyMemberRepositoryPort) {}

  async execute(input: UpdateMemberRoleInput): Promise<Result<AgencyMemberDto, DomainError>> {
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

      if (member.role.isAdmin() && !actorRole.isAdmin()) {
        return Result.fail(new InsufficientPermissionsError());
      }

      const newRole = AgencyMemberRole.create(input.newRole);
      member.updateRole(newRole);
      await this.memberRepository.save(member);

      return Result.ok({
        id: member.id,
        userId: member.userId,
        agencyId: member.agencyId,
        role: member.role.value,
        joinedAt: member.joinedAt,
        isPending: member.isPending,
      });
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
