import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserCommand } from "@/modules/auth/application/commands/create-user.command";
import type { UserRepositoryPort } from "@/modules/auth/domain/ports/user.repository.port";

function makeRepo(): UserRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe("CreateUserCommand", () => {
  let repo: UserRepositoryPort;
  let command: CreateUserCommand;

  beforeEach(() => {
    repo = makeRepo();
    command = new CreateUserCommand(repo);
  });

  it("creates and saves a new user", async () => {
    const result = await command.execute({ email: "alice@test.com", name: "Alice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.email).toBe("alice@test.com");
    }
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it("fails when user already exists", async () => {
    vi.mocked(repo.findByEmail).mockResolvedValueOnce({} as never);
    const result = await command.execute({ email: "alice@test.com", name: "Alice" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("USER_ALREADY_EXISTS");
    }
  });

  it("fails when email is invalid", async () => {
    const result = await command.execute({ email: "not-valid", name: "Alice" });
    expect(result.success).toBe(false);
  });
});
