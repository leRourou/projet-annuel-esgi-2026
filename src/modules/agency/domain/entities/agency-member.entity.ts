import { Entity } from "@/shared/domain/base/entity.base";
import type { AgencyMemberRole } from "../value-objects/agency-member-role.vo";

export interface AgencyMemberProps {
  agencyId: string;
  userId: string;
  role: AgencyMemberRole;
  joinedAt: Date | null;
  invitedBy: string;
  inviteToken: string | null;
  inviteExpiresAt: Date | null;
}

export class AgencyMember extends Entity<string> {
  private constructor(
    id: string,
    private props: AgencyMemberProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    params: {
      agencyId: string;
      userId: string;
      role: AgencyMemberRole;
      invitedBy: string;
      inviteToken?: string;
      inviteExpiresAt?: Date;
    },
  ): AgencyMember {
    return new AgencyMember(id, {
      agencyId: params.agencyId,
      userId: params.userId,
      role: params.role,
      joinedAt: params.inviteToken ? null : new Date(),
      invitedBy: params.invitedBy,
      inviteToken: params.inviteToken ?? null,
      inviteExpiresAt: params.inviteExpiresAt ?? null,
    });
  }

  static reconstitute(id: string, props: AgencyMemberProps): AgencyMember {
    return new AgencyMember(id, props);
  }

  get agencyId(): string {
    return this.props.agencyId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): AgencyMemberRole {
    return this.props.role;
  }

  get joinedAt(): Date | null {
    return this.props.joinedAt;
  }

  get invitedBy(): string {
    return this.props.invitedBy;
  }

  get inviteToken(): string | null {
    return this.props.inviteToken;
  }

  get inviteExpiresAt(): Date | null {
    return this.props.inviteExpiresAt;
  }

  get isPending(): boolean {
    return this.props.joinedAt === null;
  }

  accept(): void {
    this.props = {
      ...this.props,
      joinedAt: new Date(),
      inviteToken: null,
      inviteExpiresAt: null,
    };
  }

  updateRole(role: AgencyMemberRole): void {
    this.props = { ...this.props, role };
  }

  isInviteExpired(): boolean {
    if (!this.props.inviteExpiresAt) return false;
    return this.props.inviteExpiresAt < new Date();
  }
}
