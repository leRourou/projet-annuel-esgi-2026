import { describe, it, expect } from "vitest";
import { User } from "@/modules/auth/domain/entities/user.entity";
import { Email } from "@/modules/auth/domain/value-objects/email.vo";
import { UserRole } from "@/modules/auth/domain/value-objects/user-role.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";

function makeUser(name = "Alice") {
  return User.create("user-1", { email: Email.create("alice@test.com"), name });
}

describe("User", () => {
  it("creates a user with default MEMBER role", () => {
    const user = makeUser();
    expect(user.role.value).toBe("MEMBER");
  });

  it("throws when name is empty", () => {
    expect(() => makeUser("  ")).toThrow(DomainError);
  });

  it("updates the name", () => {
    const user = makeUser();
    user.updateName("Bob");
    expect(user.name).toBe("Bob");
  });

  it("connects notion access token", () => {
    const user = makeUser();
    expect(user.notionAccessToken).toBeUndefined();
    user.connectNotion("secret-token");
    expect(user.notionAccessToken).toBe("secret-token");
  });
});
