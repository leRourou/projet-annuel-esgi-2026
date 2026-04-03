import { AgencyMemberRole } from "@/modules/agency/domain/value-objects/agency-member-role.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

describe("AgencyMemberRole", () => {
  it("creates ADMIN role with full permissions", () => {
    const role = AgencyMemberRole.ADMIN;
    expect(role.value).toBe("ADMIN");
    expect(role.isAdmin()).toBe(true);
    expect(role.canInvite()).toBe(true);
    expect(role.canManageMembers()).toBe(true);
    expect(role.canWrite()).toBe(true);
    expect(role.canPublish()).toBe(true);
  });

  it("creates MEMBER role with write permissions only", () => {
    const role = AgencyMemberRole.MEMBER;
    expect(role.value).toBe("MEMBER");
    expect(role.isAdmin()).toBe(false);
    expect(role.canInvite()).toBe(false);
    expect(role.canManageMembers()).toBe(false);
    expect(role.canWrite()).toBe(true);
    expect(role.canPublish()).toBe(true);
  });

  it("creates VIEWER role with no write permissions", () => {
    const role = AgencyMemberRole.VIEWER;
    expect(role.value).toBe("VIEWER");
    expect(role.isAdmin()).toBe(false);
    expect(role.canInvite()).toBe(false);
    expect(role.canManageMembers()).toBe(false);
    expect(role.canWrite()).toBe(false);
    expect(role.canPublish()).toBe(false);
  });

  it("creates a role from a valid string", () => {
    const role = AgencyMemberRole.create("MEMBER");
    expect(role.value).toBe("MEMBER");
  });

  it("throws on invalid role value", () => {
    expect(() => AgencyMemberRole.create("SUPERADMIN")).toThrow(DomainError);
  });

  it("two roles with same value are equal", () => {
    expect(AgencyMemberRole.create("ADMIN").equals(AgencyMemberRole.ADMIN)).toBe(true);
  });
});
