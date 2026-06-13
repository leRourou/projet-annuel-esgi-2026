import type { AgencyContextRepositoryPort } from "../../domain/ports/agency-context.repository.port";
import { type AgencyContextDto, toAgencyContextDto } from "../dto/agency-context.dto";

export class GetAgencyContextQuery {
  constructor(private readonly agencyContextRepository: AgencyContextRepositoryPort) {}

  async execute(agencyId: string): Promise<AgencyContextDto | null> {
    const context = await this.agencyContextRepository.findByAgencyId(agencyId);
    return context ? toAgencyContextDto(context) : null;
  }
}
