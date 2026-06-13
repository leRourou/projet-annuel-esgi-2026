import { Entity } from "@/shared/domain/base/entity.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export interface AgencyContextProps {
  agencyId: string;
  sector: string;
  targetAudience: string;
  toneOfVoice: string;
  brandKeywords: string[];
  additionalContext: string | null;
  updatedAt: Date;
}

export class AgencyContext extends Entity<string> {
  private constructor(
    id: string,
    private props: AgencyContextProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    params: {
      agencyId: string;
      sector: string;
      targetAudience: string;
      toneOfVoice: string;
      brandKeywords: string[];
      additionalContext?: string | null;
    },
  ): AgencyContext {
    AgencyContext.validateSector(params.sector);
    AgencyContext.validateTargetAudience(params.targetAudience);
    AgencyContext.validateToneOfVoice(params.toneOfVoice);

    return new AgencyContext(id, {
      agencyId: params.agencyId,
      sector: params.sector.trim(),
      targetAudience: params.targetAudience.trim(),
      toneOfVoice: params.toneOfVoice.trim(),
      brandKeywords: params.brandKeywords.map((k) => k.trim()).filter(Boolean),
      additionalContext: params.additionalContext?.trim() || null,
      updatedAt: new Date(),
    });
  }

  static reconstitute(id: string, props: AgencyContextProps): AgencyContext {
    return new AgencyContext(id, props);
  }

  private static validateSector(sector: string): void {
    if (!sector.trim()) {
      throw new DomainError("Sector cannot be empty", "INVALID_AGENCY_CONTEXT_SECTOR");
    }
    if (sector.trim().length > 200) {
      throw new DomainError(
        "Sector must be 200 characters or less",
        "AGENCY_CONTEXT_SECTOR_TOO_LONG",
      );
    }
  }

  private static validateTargetAudience(audience: string): void {
    if (!audience.trim()) {
      throw new DomainError("Target audience cannot be empty", "INVALID_AGENCY_CONTEXT_AUDIENCE");
    }
    if (audience.trim().length > 500) {
      throw new DomainError(
        "Target audience must be 500 characters or less",
        "AGENCY_CONTEXT_AUDIENCE_TOO_LONG",
      );
    }
  }

  private static validateToneOfVoice(tone: string): void {
    if (!tone.trim()) {
      throw new DomainError("Tone of voice cannot be empty", "INVALID_AGENCY_CONTEXT_TONE");
    }
    if (tone.trim().length > 200) {
      throw new DomainError(
        "Tone of voice must be 200 characters or less",
        "AGENCY_CONTEXT_TONE_TOO_LONG",
      );
    }
  }

  update(params: {
    sector?: string;
    targetAudience?: string;
    toneOfVoice?: string;
    brandKeywords?: string[];
    additionalContext?: string | null;
  }): void {
    if (params.sector !== undefined) AgencyContext.validateSector(params.sector);
    if (params.targetAudience !== undefined)
      AgencyContext.validateTargetAudience(params.targetAudience);
    if (params.toneOfVoice !== undefined) AgencyContext.validateToneOfVoice(params.toneOfVoice);

    this.props = {
      ...this.props,
      sector: params.sector !== undefined ? params.sector.trim() : this.props.sector,
      targetAudience:
        params.targetAudience !== undefined
          ? params.targetAudience.trim()
          : this.props.targetAudience,
      toneOfVoice:
        params.toneOfVoice !== undefined ? params.toneOfVoice.trim() : this.props.toneOfVoice,
      brandKeywords:
        params.brandKeywords !== undefined
          ? params.brandKeywords.map((k) => k.trim()).filter(Boolean)
          : this.props.brandKeywords,
      additionalContext:
        params.additionalContext !== undefined
          ? params.additionalContext?.trim() || null
          : this.props.additionalContext,
      updatedAt: new Date(),
    };
  }

  toPromptString(): string {
    const parts: string[] = [
      `Industry/Sector: ${this.props.sector}`,
      `Target Audience: ${this.props.targetAudience}`,
      `Tone of Voice: ${this.props.toneOfVoice}`,
    ];
    if (this.props.brandKeywords.length > 0) {
      parts.push(`Brand Keywords: ${this.props.brandKeywords.join(", ")}`);
    }
    if (this.props.additionalContext) {
      parts.push(`Additional Context: ${this.props.additionalContext}`);
    }
    return parts.join("\n");
  }

  get agencyId(): string {
    return this.props.agencyId;
  }
  get sector(): string {
    return this.props.sector;
  }
  get targetAudience(): string {
    return this.props.targetAudience;
  }
  get toneOfVoice(): string {
    return this.props.toneOfVoice;
  }
  get brandKeywords(): string[] {
    return this.props.brandKeywords;
  }
  get additionalContext(): string | null {
    return this.props.additionalContext;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
