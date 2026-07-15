import type { AgencyMember } from "../entities/agency-member.entity";

export interface AgencyMemberRepositoryPort {
  findByAgencyAndUser(agencyId: string, userId: string): Promise<AgencyMember | null>;
  findByInviteToken(token: string): Promise<AgencyMember | null>;
  findAllByAgency(agencyId: string): Promise<AgencyMember[]>;
  findByUser(userId: string): Promise<AgencyMember | null>;
  findAllByUser(userId: string): Promise<AgencyMember[]>;
  save(member: AgencyMember): Promise<void>;
  delete(agencyId: string, userId: string): Promise<void>;
}
