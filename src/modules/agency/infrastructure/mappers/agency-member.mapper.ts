import { AgencyMember } from "../../domain/entities/agency-member.entity";
import { AgencyMemberRole } from "../../domain/value-objects/agency-member-role.vo";
import type { AgencyMemberTypeormEntity } from "../entities/agency-member.typeorm-entity";

export class AgencyMemberMapper {
  static toDomain(entity: AgencyMemberTypeormEntity): AgencyMember {
    return AgencyMember.reconstitute(entity.id, {
      agencyId: entity.agencyId,
      userId: entity.userId,
      role: AgencyMemberRole.create(entity.role),
      joinedAt: entity.joinedAt,
      invitedBy: entity.invitedBy,
      inviteToken: entity.inviteToken,
      inviteExpiresAt: entity.inviteExpiresAt,
    });
  }

  static toPersistence(member: AgencyMember): Partial<AgencyMemberTypeormEntity> {
    return {
      id: member.id,
      agencyId: member.agencyId,
      userId: member.userId,
      role: member.role.value,
      joinedAt: member.joinedAt,
      invitedBy: member.invitedBy,
      inviteToken: member.inviteToken,
      inviteExpiresAt: member.inviteExpiresAt,
    };
  }
}
