import { Theme } from "@/modules/agency/domain/entities/theme.entity";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

describe("Theme", () => {
  it("creates a valid theme", () => {
    const theme = Theme.create("t-1", { name: "SEO", agencyId: "agency-1" });
    expect(theme.name).toBe("SEO");
    expect(theme.agencyId).toBe("agency-1");
    expect(theme.createdAt).toBeInstanceOf(Date);
  });

  it("trims whitespace from name", () => {
    const theme = Theme.create("t-1", { name: "  Marketing  ", agencyId: "agency-1" });
    expect(theme.name).toBe("Marketing");
  });

  it("throws when name is empty", () => {
    expect(() => Theme.create("t-1", { name: "   ", agencyId: "agency-1" })).toThrow(DomainError);
  });

  it("throws when name exceeds 100 chars", () => {
    const longName = "a".repeat(101);
    expect(() => Theme.create("t-1", { name: longName, agencyId: "agency-1" })).toThrow(
      DomainError,
    );
  });

  it("accepts name of exactly 100 chars", () => {
    const name = "a".repeat(100);
    const theme = Theme.create("t-1", { name, agencyId: "agency-1" });
    expect(theme.name).toBe(name);
  });

  it("can rename", () => {
    const theme = Theme.create("t-1", { name: "SEO", agencyId: "agency-1" });
    theme.rename("Content Marketing");
    expect(theme.name).toBe("Content Marketing");
  });

  it("throws on rename with empty string", () => {
    const theme = Theme.create("t-1", { name: "SEO", agencyId: "agency-1" });
    expect(() => theme.rename("")).toThrow(DomainError);
  });

  it("reconstitutes from persistence", () => {
    const date = new Date("2024-01-01");
    const theme = Theme.reconstitute("t-1", { name: "SEO", agencyId: "agency-1", createdAt: date });
    expect(theme.id).toBe("t-1");
    expect(theme.createdAt).toBe(date);
  });
});
