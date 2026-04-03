import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { InvalidInviteTokenError } from "../../domain/errors/agency.errors";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyMemberDto } from "../dto/agency.dto";

export interface AcceptInviteInput {
  token: string;
  userId: string;
}

export class AcceptInviteCommand {
  constructor(private readonly memberRepository: AgencyMemberRepositoryPort) {}

  async execute(input: AcceptInviteInput): Promise<Result<AgencyMemberDto, DomainError>> {
    try {
      const member = await this.memberRepository.findByInviteToken(input.token);

      if (!member || member.userId !== input.userId || member.isInviteExpired()) {
        return Result.fail(new InvalidInviteTokenError());
      }

      member.accept();
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
