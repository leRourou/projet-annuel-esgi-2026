import { randomUUID } from "node:crypto";
import { User } from "@/modules/auth/domain/entities/user.entity";
import type { UserRepositoryPort } from "@/modules/auth/domain/ports/user.repository.port";
import { Email } from "@/modules/auth/domain/value-objects/email.vo";
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

      let targetUser = await this.userRepository.findByEmail(input.targetEmail);
      if (!targetUser) {
        // No account yet for this email — create a placeholder user so the invite
        // can be issued now; they'll use it as-is once they sign in via magic link.
        const email = Email.create(input.targetEmail);
        targetUser = User.create(randomUUID(), {
          email,
          name: input.targetEmail.split("@")[0] || input.targetEmail,
        });
        await this.userRepository.save(targetUser);
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
          userEmail: targetUser.email.value,
          userName: targetUser.name,
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
