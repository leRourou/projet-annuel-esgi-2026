import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/base/value-object.base";

export type UserRoleValue = "ADMIN" | "MEMBER" | "VIEWER";

interface UserRoleProps {
  readonly value: UserRoleValue;
}

export class UserRole extends ValueObject<UserRoleProps> {
  static readonly ADMIN = new UserRole({ value: "ADMIN" });
  static readonly MEMBER = new UserRole({ value: "MEMBER" });
  static readonly VIEWER = new UserRole({ value: "VIEWER" });

  private static readonly VALID_ROLES: UserRoleValue[] = ["ADMIN", "MEMBER", "VIEWER"];

  private constructor(props: UserRoleProps) {
    super(props);
  }

  static create(value: string): UserRole {
    if (!UserRole.VALID_ROLES.includes(value as UserRoleValue)) {
      throw new DomainError(
        `"${value}" is not a valid user role. Must be one of: ${UserRole.VALID_ROLES.join(", ")}`,
        "INVALID_USER_ROLE",
      );
    }
    return new UserRole({ value: value as UserRoleValue });
  }

  get value(): UserRoleValue {
    return this.props.value;
  }

  isAdmin(): boolean {
    return this.props.value === "ADMIN";
  }

  canWrite(): boolean {
    return this.props.value === "ADMIN" || this.props.value === "MEMBER";
  }

  toString(): string {
    return this.props.value;
  }
}
