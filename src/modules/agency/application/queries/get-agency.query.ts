import type { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { AgencyNotFoundError } from "../../domain/errors/agency.errors";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyRepositoryPort } from "../../domain/ports/agency.repository.port";
import type { AgencyDto } from "../dto/agency.dto";

export interface GetAgencyInput {
  agencyId: string;
}

export class GetAgencyQuery {
  constructor(
    private readonly agencyRepository: AgencyRepositoryPort,
    private readonly memberRepository: AgencyMemberRepositoryPort,
  ) {}

  async execute(input: GetAgencyInput): Promise<Result<AgencyDto, DomainError>> {
    const agency = await this.agencyRepository.findById(input.agencyId);
    if (!agency) {
      return Result.fail(new AgencyNotFoundError(input.agencyId));
    }

    const members = await this.memberRepository.findAllByAgency(input.agencyId);

    return Result.ok({
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      createdAt: agency.createdAt,
      memberCount: members.length,
    });
  }
}
