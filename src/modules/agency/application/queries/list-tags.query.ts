import type { TagRepositoryPort } from "../../domain/ports/tag.repository.port";
import { type TagDto, toTagDto } from "../dto/tag.dto";

export class ListTagsQuery {
  constructor(private readonly tagRepository: TagRepositoryPort) {}

  async execute(agencyId: string): Promise<TagDto[]> {
    const tags = await this.tagRepository.findByAgencyId(agencyId);
    return tags.map(toTagDto);
  }
}
