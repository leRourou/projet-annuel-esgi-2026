import { randomUUID } from "crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { AgencyMember } from "../../domain/entities/agency-member.entity";
import { Agency } from "../../domain/entities/agency.entity";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyRepositoryPort } from "../../domain/ports/agency.repository.port";
import { AgencyMemberRole } from "../../domain/value-objects/agency-member-role.vo";
import type { AgencyDto } from "../dto/agency.dto";

export interface CreateAgencyInput {
  name: string;
  slug: string;
  creatorUserId: string;
}

export class CreateAgencyCommand {
  constructor(
    private readonly agencyRepository: AgencyRepositoryPort,
    private readonly memberRepository: AgencyMemberRepositoryPort,
  ) {}

  async execute(input: CreateAgencyInput): Promise<Result<AgencyDto, DomainError>> {
    try {
      const existing = await this.agencyRepository.findBySlug(input.slug.trim().toLowerCase());
      if (existing) {
        return Result.fail(
          new DomainError(`Slug "${input.slug}" is already taken`, "AGENCY_SLUG_TAKEN"),
        );
      }

      const agency = Agency.create(randomUUID(), { name: input.name, slug: input.slug });
      await this.agencyRepository.save(agency);

      const member = AgencyMember.create(randomUUID(), {
        agencyId: agency.id,
        userId: input.creatorUserId,
        role: AgencyMemberRole.ADMIN,
        invitedBy: input.creatorUserId,
      });
      await this.memberRepository.save(member);

      return Result.ok({
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        createdAt: agency.createdAt,
        memberCount: 1,
        notionConnected: false,
        notionDatabaseId: null,
      });
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
