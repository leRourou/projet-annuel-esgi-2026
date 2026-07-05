import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { UserRole } from "../../domain/value-objects/user-role.vo";
import type { UserTypeormEntity } from "../entities/user.typeorm-entity";

export class UserMapper {
  static toDomain(entity: UserTypeormEntity): User {
    return User.reconstitute(entity.id, {
      email: Email.create(entity.email),
      name: entity.name,
      role: UserRole.create(entity.role),
      notionAccessToken: entity.notionAccessToken ?? undefined,
      onboardingCompleted: entity.onboardingCompleted,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(user: User): Partial<UserTypeormEntity> {
    return {
      id: user.id,
      email: user.email.value,
      name: user.name,
      role: user.role.value,
      notionAccessToken: user.notionAccessToken ?? null,
      onboardingCompleted: user.onboardingCompleted,
    };
  }
}
