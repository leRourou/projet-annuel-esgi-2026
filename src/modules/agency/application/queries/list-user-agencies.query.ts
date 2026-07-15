import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyRepositoryPort } from "../../domain/ports/agency.repository.port";

export interface UserAgencySummary {
  agencyId: string;
  agencyName: string;
  role: string;
  isPending: boolean;
}

export class ListUserAgenciesQuery {
  constructor(
    private readonly memberRepository: AgencyMemberRepositoryPort,
    private readonly agencyRepository: AgencyRepositoryPort,
  ) {}

  async execute(userId: string): Promise<UserAgencySummary[]> {
    const memberships = await this.memberRepository.findAllByUser(userId);
    const joined = memberships.filter((m) => m.joinedAt !== null);
    if (joined.length === 0) return [];

    const agencies = await this.agencyRepository.findByIds(joined.map((m) => m.agencyId));
    const agenciesById = new Map(agencies.map((a) => [a.id, a]));

    const summaries: UserAgencySummary[] = [];
    for (const m of joined) {
      const agency = agenciesById.get(m.agencyId);
      if (!agency) continue;
      summaries.push({
        agencyId: m.agencyId,
        agencyName: agency.name,
        role: m.role.value,
        isPending: m.isPending,
      });
    }
    return summaries;
  }
}
