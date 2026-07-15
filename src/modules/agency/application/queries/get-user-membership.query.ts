import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyMemberDto } from "../dto/agency.dto";

export class GetUserMembershipQuery {
  constructor(private readonly memberRepository: AgencyMemberRepositoryPort) {}

  async execute(userId: string, preferredAgencyId?: string): Promise<AgencyMemberDto | null> {
    const memberships = await this.memberRepository.findAllByUser(userId);
    if (memberships.length === 0) return null;

    const member =
      (preferredAgencyId && memberships.find((m) => m.agencyId === preferredAgencyId)) ||
      memberships.find((m) => m.joinedAt !== null) ||
      memberships[0];
    if (!member) return null;

    return {
      id: member.id,
      userId: member.userId,
      userEmail: null,
      userName: null,
      agencyId: member.agencyId,
      role: member.role.value,
      joinedAt: member.joinedAt,
      isPending: member.isPending,
    };
  }
}
