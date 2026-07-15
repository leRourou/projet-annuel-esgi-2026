import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import { z } from "zod";
import { AgencyContext } from "../../domain/entities/agency-context.entity";
import type { AgencyContextRepositoryPort } from "../../domain/ports/agency-context.repository.port";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { AgencyRepositoryPort } from "../../domain/ports/agency.repository.port";
import { type AgencyContextDto, toAgencyContextDto } from "../dto/agency-context.dto";

export const UpdateAgencyContextInputSchema = z.object({
  agencyId: z.string().uuid(),
  requestingUserId: z.string().uuid(),
  sector: z.string().min(1).max(200),
  targetAudience: z.string().min(1).max(500),
  toneOfVoice: z.string().min(1).max(200),
  brandKeywords: z.array(z.string().min(1).max(100)).max(20).default([]),
  additionalContext: z.string().max(2000).nullable().optional(),
});

export type UpdateAgencyContextInput = z.infer<typeof UpdateAgencyContextInputSchema>;

export class UpdateAgencyContextCommand {
  constructor(
    private readonly agencyContextRepository: AgencyContextRepositoryPort,
    private readonly agencyRepository: AgencyRepositoryPort,
    private readonly memberRepository: AgencyMemberRepositoryPort,
  ) {}

  async execute(input: UpdateAgencyContextInput): Promise<Result<AgencyContextDto, DomainError>> {
    try {
      const agency = await this.agencyRepository.findById(input.agencyId);
      if (!agency) {
        return Result.fail(new NotFoundError("Agency", input.agencyId));
      }

      const member = await this.memberRepository.findByAgencyAndUser(
        input.agencyId,
        input.requestingUserId,
      );
      if (!member || !member.role.isAdmin()) {
        return Result.fail(
          new DomainError("Only admins can update agency context", "INSUFFICIENT_PERMISSIONS"),
        );
      }

      let context = await this.agencyContextRepository.findByAgencyId(input.agencyId);

      if (!context) {
        context = AgencyContext.create(randomUUID(), {
          agencyId: input.agencyId,
          sector: input.sector,
          targetAudience: input.targetAudience,
          toneOfVoice: input.toneOfVoice,
          brandKeywords: input.brandKeywords,
          additionalContext: input.additionalContext ?? null,
        });
      } else {
        context.update({
          sector: input.sector,
          targetAudience: input.targetAudience,
          toneOfVoice: input.toneOfVoice,
          brandKeywords: input.brandKeywords,
          additionalContext: input.additionalContext ?? null,
        });
      }

      await this.agencyContextRepository.save(context);
      return Result.ok(toAgencyContextDto(context));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
