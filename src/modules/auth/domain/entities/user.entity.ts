import { AggregateRoot } from "@/shared/domain/base/aggregate-root.base";
import { DomainError } from "@/shared/domain/errors/domain.error";
import type { Email } from "../value-objects/email.vo";
import { UserRole } from "../value-objects/user-role.vo";

export interface UserProps {
  email: Email;
  name: string;
  role: UserRole;
  notionAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<string> {
  private constructor(
    id: string,
    private props: UserProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    params: {
      email: Email;
      name: string;
      role?: UserRole;
    },
  ): User {
    if (!params.name.trim()) {
      throw new DomainError("User name cannot be empty", "INVALID_USER_NAME");
    }
    const now = new Date();
    return new User(id, {
      email: params.email,
      name: params.name.trim(),
      role: params.role ?? UserRole.MEMBER,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: UserProps): User {
    return new User(id, props);
  }

  get email(): Email {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get notionAccessToken(): string | undefined {
    return this.props.notionAccessToken;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  connectNotion(accessToken: string): void {
    this.props = { ...this.props, notionAccessToken: accessToken, updatedAt: new Date() };
  }

  updateName(name: string): void {
    if (!name.trim()) {
      throw new DomainError("User name cannot be empty", "INVALID_USER_NAME");
    }
    this.props = { ...this.props, name: name.trim(), updatedAt: new Date() };
  }
}
