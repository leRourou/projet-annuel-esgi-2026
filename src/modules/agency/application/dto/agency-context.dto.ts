import type { AgencyContext } from "../../domain/entities/agency-context.entity";

export interface AgencyContextDto {
  id: string;
  agencyId: string;
  sector: string;
  targetAudience: string;
  toneOfVoice: string;
  brandKeywords: string[];
  additionalContext: string | null;
  updatedAt: Date;
}

export function toAgencyContextDto(context: AgencyContext): AgencyContextDto {
  return {
    id: context.id,
    agencyId: context.agencyId,
    sector: context.sector,
    targetAudience: context.targetAudience,
    toneOfVoice: context.toneOfVoice,
    brandKeywords: context.brandKeywords,
    additionalContext: context.additionalContext,
    updatedAt: context.updatedAt,
  };
}
