import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.port";
import { type UserDto, toUserDto } from "../dto/user.dto";

export class GetUserByIdQuery {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(id: string): Promise<Result<UserDto, NotFoundError>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return Result.fail(new NotFoundError("User", id));
    }
    return Result.ok(toUserDto(user));
  }
}
