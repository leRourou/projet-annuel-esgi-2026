import { describe, it, expect } from "vitest";
import { Email } from "@/modules/auth/domain/value-objects/email.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";

describe("Email", () => {
  it("creates a valid email and normalises to lowercase", () => {
    const email = Email.create("  USER@Example.COM  ");
    expect(email.value).toBe("user@example.com");
  });

  it("throws DomainError for an invalid email", () => {
    expect(() => Email.create("not-an-email")).toThrow(DomainError);
  });

  it("equals() returns true for same email", () => {
    const a = Email.create("test@test.com");
    const b = Email.create("test@test.com");
    expect(a.equals(b)).toBe(true);
  });

  it("equals() returns false for different emails", () => {
    const a = Email.create("a@test.com");
    const b = Email.create("b@test.com");
    expect(a.equals(b)).toBe(false);
  });
});
