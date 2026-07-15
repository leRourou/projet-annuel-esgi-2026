import type { UserRepositoryPort } from "../../../auth/domain/ports/user.repository.port";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyMemberDto } from "../dto/agency.dto";

export interface ListMembersInput {
  agencyId: string;
}

export class ListMembersQuery {
  constructor(
    private readonly memberRepository: AgencyMemberRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: ListMembersInput): Promise<AgencyMemberDto[]> {
    const members = await this.memberRepository.findAllByAgency(input.agencyId);
    const users = await this.userRepository.findByIds(members.map((m) => m.userId));
    const usersById = new Map(users.map((u) => [u.id, u]));

    return members.map((m) => {
      const user = usersById.get(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        userEmail: user?.email.value ?? null,
        userName: user?.name ?? null,
        agencyId: m.agencyId,
        role: m.role.value,
        joinedAt: m.joinedAt,
        isPending: m.isPending,
      };
    });
  }
}
