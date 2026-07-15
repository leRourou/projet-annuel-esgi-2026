import { CompleteOnboardingCommand } from "@/modules/auth/application/commands/complete-onboarding.command";
import { User } from "@/modules/auth/domain/entities/user.entity";
import type { UserRepositoryPort } from "@/modules/auth/domain/ports/user.repository.port";
import { Email } from "@/modules/auth/domain/value-objects/email.vo";
import { describe, expect, it, vi } from "vitest";

function makeUser(): User {
  return User.create("user-1", { email: Email.create("alice@test.com"), name: "Alice" });
}

function makeRepo(user: User | null = makeUser()): UserRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(user),
    findByIds: vi.fn().mockResolvedValue([]),
    findByEmail: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  };
}

describe("CompleteOnboardingCommand", () => {
  it("marks the user's onboarding as completed and saves it", async () => {
    const user = makeUser();
    const repo = makeRepo(user);
    const command = new CompleteOnboardingCommand(repo);

    const result = await command.execute("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.onboardingCompleted).toBe(true);
    }
    expect(user.onboardingCompleted).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(user);
  });

  it("returns NotFoundError when the user does not exist", async () => {
    const repo = makeRepo(null);
    const command = new CompleteOnboardingCommand(repo);

    const result = await command.execute("missing-user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
    expect(repo.save).not.toHaveBeenCalled();
  });
});
