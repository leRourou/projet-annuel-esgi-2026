import { randomUUID } from "crypto";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { Result } from "@/shared/domain/types/result.type";
import { User } from "../../domain/entities/user.entity";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.port";
import { Email } from "../../domain/value-objects/email.vo";
import { type UserDto, toUserDto } from "../dto/user.dto";

export interface CreateUserInput {
  email: string;
  name: string;
}

export class CreateUserCommand {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(input: CreateUserInput): Promise<Result<UserDto, DomainError>> {
    try {
      const email = Email.create(input.email);
      const existing = await this.userRepository.findByEmail(email.value);
      if (existing) {
        return Result.fail(
          new DomainError("A user with this email already exists", "USER_ALREADY_EXISTS"),
        );
      }

      const user = User.create(randomUUID(), { email, name: input.name });
      await this.userRepository.save(user);
      return Result.ok(toUserDto(user));
    } catch (error) {
      if (error instanceof DomainError) return Result.fail(error);
      throw error;
    }
  }
}
