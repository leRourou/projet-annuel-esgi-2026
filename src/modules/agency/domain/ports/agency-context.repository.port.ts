import type { AgencyContext } from "../entities/agency-context.entity";

export interface AgencyContextRepositoryPort {
  findByAgencyId(agencyId: string): Promise<AgencyContext | null>;
  save(context: AgencyContext): Promise<void>;
}
