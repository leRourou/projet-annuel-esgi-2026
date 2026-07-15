import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { Tag } from "../../domain/entities/tag.entity";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import type { TagRepositoryPort } from "../../domain/ports/tag.repository.port";
import { type TagDto, toTagDto } from "../dto/tag.dto";

export interface CreateTagInput {
  name: string;
  agencyId: string;
  requestingUserId: string;
}

export class CreateTagCommand {
  constructor(
    private readonly tagRepository: TagRepositoryPort,
    private readonly memberRepository: AgencyMemberRepositoryPort,
  ) {}

  async execute(input: CreateTagInput): Promise<Result<TagDto, DomainError>> {
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

      const tag = Tag.create(randomUUID(), { name: input.name, agencyId: input.agencyId });
      await this.tagRepository.save(tag);

      return Result.ok(toTagDto(tag));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
