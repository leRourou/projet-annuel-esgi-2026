import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { Theme } from "../../domain/entities/theme.entity";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { ThemeRepositoryPort } from "../../domain/ports/theme.repository.port";
import type { ThemeDto } from "../dto/theme.dto";

export interface CreateThemeInput {
  name: string;
  agencyId: string;
  requestingUserId: string;
}

export class CreateThemeCommand {
  constructor(
    private readonly themeRepository: ThemeRepositoryPort,
    private readonly memberRepository: AgencyMemberRepositoryPort,
  ) {}

  async execute(input: CreateThemeInput): Promise<Result<ThemeDto, DomainError>> {
    try {
      const member = await this.memberRepository.findByAgencyAndUser(
        input.agencyId,
        input.requestingUserId,
      );
      if (!member || !member.role.canManageMembers()) {
        return Result.fail(
          new DomainError("Only admins can manage themes", "INSUFFICIENT_PERMISSIONS"),
        );
      }

      const theme = Theme.create(randomUUID(), {
        name: input.name,
        agencyId: input.agencyId,
      });
      await this.themeRepository.save(theme);

      return Result.ok({
        id: theme.id,
        name: theme.name,
        agencyId: theme.agencyId,
        createdAt: theme.createdAt,
      });
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
