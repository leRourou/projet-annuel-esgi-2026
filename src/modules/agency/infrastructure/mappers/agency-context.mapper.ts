import { AgencyContext } from "../../domain/entities/agency-context.entity";
import type { AgencyContextTypeormEntity } from "../entities/agency-context.typeorm-entity";

export class AgencyContextMapper {
  static toDomain(entity: AgencyContextTypeormEntity): AgencyContext {
    return AgencyContext.reconstitute(entity.id, {
      agencyId: entity.agencyId,
      sector: entity.sector,
      targetAudience: entity.targetAudience,
      toneOfVoice: entity.toneOfVoice,
      brandKeywords: entity.brandKeywords ?? [],
      additionalContext: entity.additionalContext,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(context: AgencyContext): Partial<AgencyContextTypeormEntity> {
    return {
      id: context.id,
      agencyId: context.agencyId,
      sector: context.sector,
      targetAudience: context.targetAudience,
      toneOfVoice: context.toneOfVoice,
      brandKeywords: context.brandKeywords,
      additionalContext: context.additionalContext,
    };
  }
}
