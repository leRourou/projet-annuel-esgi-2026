import { Agency } from "@/modules/agency/domain/entities/agency.entity";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

describe("Agency", () => {
  it("creates an agency with valid name and slug", () => {
    const agency = Agency.create("agency-1", { name: "Acme Agency", slug: "acme-agency" });
    expect(agency.name).toBe("Acme Agency");
    expect(agency.slug).toBe("acme-agency");
    expect(agency.createdAt).toBeInstanceOf(Date);
  });

  it("trims name and lowercases slug on creation", () => {
    const agency = Agency.create("agency-1", { name: "  Acme  ", slug: "ACME" });
    expect(agency.name).toBe("Acme");
    expect(agency.slug).toBe("acme");
  });

  it("throws when name is empty", () => {
    expect(() => Agency.create("agency-1", { name: "   ", slug: "acme" })).toThrow(DomainError);
  });

  it("throws when slug contains invalid characters", () => {
    expect(() => Agency.create("agency-1", { name: "Acme", slug: "Acme Agency!" })).toThrow(
      DomainError,
    );
  });

  it("throws when slug is empty", () => {
    expect(() => Agency.create("agency-1", { name: "Acme", slug: "   " })).toThrow(DomainError);
  });

  it("updates the name", () => {
    const agency = Agency.create("agency-1", { name: "Acme", slug: "acme" });
    agency.updateName("New Name");
    expect(agency.name).toBe("New Name");
  });

  it("throws when updating to empty name", () => {
    const agency = Agency.create("agency-1", { name: "Acme", slug: "acme" });
    expect(() => agency.updateName("")).toThrow(DomainError);
  });
});
