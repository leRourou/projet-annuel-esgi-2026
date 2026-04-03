import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyMemberDto } from "../dto/agency.dto";

export class GetUserMembershipQuery {
  constructor(private readonly memberRepository: AgencyMemberRepositoryPort) {}

  async execute(userId: string): Promise<AgencyMemberDto | null> {
    const member = await this.memberRepository.findByUser(userId);
    if (!member) return null;
    return {
      id: member.id,
      userId: member.userId,
      agencyId: member.agencyId,
      role: member.role.value,
      joinedAt: member.joinedAt,
      isPending: member.isPending,
    };
  }
}
