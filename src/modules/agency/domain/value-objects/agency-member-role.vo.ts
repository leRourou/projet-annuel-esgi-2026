import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

export type AgencyMemberRoleValue = "ADMIN" | "MEMBER" | "VIEWER";

interface AgencyMemberRoleProps {
  readonly value: AgencyMemberRoleValue;
}

export class AgencyMemberRole extends ValueObject<AgencyMemberRoleProps> {
  static readonly ADMIN = new AgencyMemberRole({ value: "ADMIN" });
  static readonly MEMBER = new AgencyMemberRole({ value: "MEMBER" });
  static readonly VIEWER = new AgencyMemberRole({ value: "VIEWER" });

  private static readonly VALID_ROLES: AgencyMemberRoleValue[] = ["ADMIN", "MEMBER", "VIEWER"];

  private constructor(props: AgencyMemberRoleProps) {
    super(props);
  }

  static create(value: string): AgencyMemberRole {
    if (!AgencyMemberRole.VALID_ROLES.includes(value as AgencyMemberRoleValue)) {
      throw new DomainError(
        `"${value}" is not a valid agency member role. Must be one of: ${AgencyMemberRole.VALID_ROLES.join(", ")}`,
        "INVALID_AGENCY_MEMBER_ROLE",
      );
    }
    return new AgencyMemberRole({ value: value as AgencyMemberRoleValue });
  }

  get value(): AgencyMemberRoleValue {
    return this.props.value;
  }

  isAdmin(): boolean {
    return this.props.value === "ADMIN";
  }

  canInvite(): boolean {
    return this.props.value === "ADMIN";
  }

  canManageMembers(): boolean {
    return this.props.value === "ADMIN";
  }

  canWrite(): boolean {
    return this.props.value === "ADMIN" || this.props.value === "MEMBER";
  }

  canPublish(): boolean {
    return this.props.value === "ADMIN" || this.props.value === "MEMBER";
  }

  toString(): string {
    return this.props.value;
  }
}
