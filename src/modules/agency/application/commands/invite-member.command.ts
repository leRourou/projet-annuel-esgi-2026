import { randomUUID } from "crypto";
import type { UserRepositoryPort } from "@/modules/auth/domain/ports/user.repository.port";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { AgencyMember } from "../../domain/entities/agency-member.entity";
import {
  InsufficientPermissionsError,
  MemberAlreadyExistsError,
} from "../../domain/errors/agency.errors";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import { AgencyMemberRole } from "../../domain/value-objects/agency-member-role.vo";
import type { AgencyMemberDto } from "../dto/agency.dto";

export interface InviteMemberInput {
  agencyId: string;
  inviterUserId: string;
  inviterRole: string;
  targetEmail: string;
  role: string;
}

export interface InviteMemberOutput {
  member: AgencyMemberDto;
  inviteToken: string;
}

export class InviteMemberCommand {
  constructor(
    private readonly memberRepository: AgencyMemberRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: InviteMemberInput): Promise<Result<InviteMemberOutput, DomainError>> {
    try {
      const inviterRole = AgencyMemberRole.create(input.inviterRole);
      if (!inviterRole.canInvite()) {
        return Result.fail(new InsufficientPermissionsError());
      }

      const role = AgencyMemberRole.create(input.role);

      const targetUser = await this.userRepository.findByEmail(input.targetEmail);
      if (!targetUser) {
        return Result.fail(
          new DomainError(`No user found with email "${input.targetEmail}"`, "USER_NOT_FOUND"),
        );
      }

      const existing = await this.memberRepository.findByAgencyAndUser(
        input.agencyId,
        targetUser.id,
      );
      if (existing) {
        return Result.fail(new MemberAlreadyExistsError(input.targetEmail));
      }

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const member = AgencyMember.create(randomUUID(), {
        agencyId: input.agencyId,
        userId: targetUser.id,
        role,
        invitedBy: input.inviterUserId,
        inviteToken: token,
        inviteExpiresAt: expiresAt,
      });

      await this.memberRepository.save(member);

      return Result.ok({
        member: {
          id: member.id,
          userId: member.userId,
          agencyId: member.agencyId,
          role: member.role.value,
          joinedAt: member.joinedAt,
          isPending: member.isPending,
        },
        inviteToken: token,
      });
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
