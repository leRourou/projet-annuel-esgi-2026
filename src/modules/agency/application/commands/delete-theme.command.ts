import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { ThemeRepositoryPort } from "../../domain/ports/theme.repository.port";

export interface DeleteThemeInput {
  themeId: string;
  agencyId: string;
  requestingUserId: string;
}

export class DeleteThemeCommand {
  constructor(
    private readonly themeRepository: ThemeRepositoryPort,
    private readonly memberRepository: AgencyMemberRepositoryPort,
  ) {}

  async execute(input: DeleteThemeInput): Promise<Result<void, DomainError>> {
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

      const theme = await this.themeRepository.findById(input.themeId);
      if (!theme) {
        return Result.fail(new DomainError("Theme not found", "THEME_NOT_FOUND"));
      }
      if (theme.agencyId !== input.agencyId) {
        return Result.fail(
          new DomainError("Theme does not belong to this agency", "THEME_NOT_FOUND"),
        );
      }

      await this.themeRepository.delete(input.themeId);
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
