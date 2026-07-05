import { NotFoundError } from "@/shared/domain/errors/not-found.error";
import { Result } from "@/shared/domain/types/result.type";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.port";
import { type UserDto, toUserDto } from "../dto/user.dto";

export class CompleteOnboardingCommand {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(userId: string): Promise<Result<UserDto, NotFoundError>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(new NotFoundError("User", userId));
    }

    user.completeOnboarding();
    await this.userRepository.save(user);

    return Result.ok(toUserDto(user));
  }
}
