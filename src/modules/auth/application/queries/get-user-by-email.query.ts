import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.port";
import { toUserDto, type UserDto } from "../dto/user.dto";

export class GetUserByEmailQuery {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(email: string): Promise<Result<UserDto, NotFoundError>> {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return Result.fail(new NotFoundError("User", email));
    }
    return Result.ok(toUserDto(user));
  }
}
