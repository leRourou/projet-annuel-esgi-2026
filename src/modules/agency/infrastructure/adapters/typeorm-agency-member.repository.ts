import type { DataSource, Repository } from "typeorm";
import type { AgencyMember } from "../../domain/entities/agency-member.entity";
import type { AgencyMemberRepositoryPort } from "../../domain/ports/agency-member.repository.port";
import { AgencyMemberTypeormEntity } from "../entities/agency-member.typeorm-entity";
import { AgencyMemberMapper } from "../mappers/agency-member.mapper";

export class TypeormAgencyMemberRepository implements AgencyMemberRepositoryPort {
  private readonly repo: Repository<AgencyMemberTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(AgencyMemberTypeormEntity);
  }

  async findByAgencyAndUser(agencyId: string, userId: string): Promise<AgencyMember | null> {
    const entity = await this.repo.findOneBy({ agencyId, userId });
    return entity ? AgencyMemberMapper.toDomain(entity) : null;
  }

  async findByInviteToken(token: string): Promise<AgencyMember | null> {
    const entity = await this.repo.findOneBy({ inviteToken: token });
    return entity ? AgencyMemberMapper.toDomain(entity) : null;
  }

  async findAllByAgency(agencyId: string): Promise<AgencyMember[]> {
    const entities = await this.repo.findBy({ agencyId });
    return entities.map(AgencyMemberMapper.toDomain);
  }

  async findByUser(userId: string): Promise<AgencyMember | null> {
    const entity = await this.repo.findOneBy({ userId });
    return entity ? AgencyMemberMapper.toDomain(entity) : null;
  }

  async findAllByUser(userId: string): Promise<AgencyMember[]> {
    const entities = await this.repo.findBy({ userId });
    return entities.map(AgencyMemberMapper.toDomain);
  }

  async save(member: AgencyMember): Promise<void> {
    await this.repo.save(AgencyMemberMapper.toPersistence(member));
  }

  async delete(agencyId: string, userId: string): Promise<void> {
    await this.repo.delete({ agencyId, userId });
  }
}
