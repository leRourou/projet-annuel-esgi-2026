import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyMemberDto } from "../dto/agency.dto";

export interface ListMembersInput {
  agencyId: string;
}

export class ListMembersQuery {
  constructor(private readonly memberRepository: AgencyMemberRepositoryPort) {}

  async execute(input: ListMembersInput): Promise<AgencyMemberDto[]> {
    const members = await this.memberRepository.findAllByAgency(input.agencyId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      agencyId: m.agencyId,
      role: m.role.value,
      joinedAt: m.joinedAt,
      isPending: m.isPending,
    }));
  }
}
