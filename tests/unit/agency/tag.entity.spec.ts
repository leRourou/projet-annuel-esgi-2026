import { Tag } from "@/modules/agency/domain/entities/tag.entity";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

describe("Tag", () => {
  it("creates a valid tag", () => {
    const tag = Tag.create("tag-1", { name: "SEO", agencyId: "agency-1" });
    expect(tag.name).toBe("SEO");
    expect(tag.agencyId).toBe("agency-1");
    expect(tag.createdAt).toBeInstanceOf(Date);
  });

  it("trims whitespace from name", () => {
    const tag = Tag.create("tag-1", { name: "  Marketing  ", agencyId: "agency-1" });
    expect(tag.name).toBe("Marketing");
  });

  it("throws when name is empty", () => {
    expect(() => Tag.create("tag-1", { name: "   ", agencyId: "agency-1" })).toThrow(DomainError);
  });

  it("throws when name exceeds 50 chars", () => {
    const longName = "a".repeat(51);
    expect(() => Tag.create("tag-1", { name: longName, agencyId: "agency-1" })).toThrow(
      DomainError,
    );
  });

  it("accepts name of exactly 50 chars", () => {
    const name = "a".repeat(50);
    const tag = Tag.create("tag-1", { name, agencyId: "agency-1" });
    expect(tag.name).toBe(name);
  });

  it("reconstitutes from persistence", () => {
    const date = new Date("2024-01-01");
    const tag = Tag.reconstitute("tag-1", { name: "SEO", agencyId: "agency-1", createdAt: date });
    expect(tag.id).toBe("tag-1");
    expect(tag.createdAt).toBe(date);
  });
});
