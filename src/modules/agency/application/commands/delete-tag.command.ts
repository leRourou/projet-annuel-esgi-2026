import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { TagRepositoryPort } from "../../domain/ports/tag.repository.port";

export interface DeleteTagInput {
  tagId: string;
  agencyId: string;
  requestingUserId: string;
}

export class DeleteTagCommand {
  constructor(
    private readonly tagRepository: TagRepositoryPort,
    private readonly memberRepository: AgencyMemberRepositoryPort,
  ) {}

  async execute(input: DeleteTagInput): Promise<Result<void, DomainError>> {
    try {
      const member = await this.memberRepository.findByAgencyAndUser(
        input.agencyId,
        input.requestingUserId,
      );
      if (!member || !member.role.isAdmin()) {
        return Result.fail(
          new DomainError("Only admins can manage tags", "INSUFFICIENT_PERMISSIONS"),
        );
      }

      const tag = await this.tagRepository.findById(input.tagId);
      if (!tag) {
        return Result.fail(new DomainError("Tag not found", "TAG_NOT_FOUND"));
      }
      if (tag.agencyId !== input.agencyId) {
        return Result.fail(new DomainError("Tag does not belong to this agency", "TAG_NOT_FOUND"));
      }

      await this.tagRepository.delete(input.tagId);
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
