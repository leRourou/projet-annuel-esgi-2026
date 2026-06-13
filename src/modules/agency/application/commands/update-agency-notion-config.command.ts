import type { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyRepositoryPort } from "../../domain/ports/agency.repository.port";
import type { AgencyDto } from "../dto/agency.dto";
import { GetAgencyQuery } from "../queries/get-agency.query";

export interface UpdateAgencyNotionConfigInput {
  agencyId: string;
  accessToken?: string;
  databaseId?: string;
}

export class UpdateAgencyNotionConfigCommand {
  private readonly getAgencyQuery: GetAgencyQuery;

  constructor(
    private readonly agencyRepository: AgencyRepositoryPort,
    memberRepository: AgencyMemberRepositoryPort,
  ) {
    this.getAgencyQuery = new GetAgencyQuery(agencyRepository, memberRepository);
  }

  async execute(input: UpdateAgencyNotionConfigInput): Promise<Result<AgencyDto, DomainError>> {
    const agency = await this.agencyRepository.findById(input.agencyId);
    if (!agency) {
      return Result.fail(new NotFoundError("Agency", input.agencyId));
    }

    if (input.accessToken) {
      agency.connectNotion(input.accessToken);
    }
    if (input.databaseId) {
      agency.setNotionDatabaseId(input.databaseId);
    }

    await this.agencyRepository.save(agency);

    return this.getAgencyQuery.execute({ agencyId: input.agencyId });
  }
}
