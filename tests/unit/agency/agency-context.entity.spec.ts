import { AgencyContext } from "@/modules/agency/domain/entities/agency-context.entity";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

const BASE = {
  agencyId: "agency-1",
  sector: "SaaS",
  targetAudience: "Marketing managers in mid-sized companies",
  toneOfVoice: "Professional and empathetic",
  brandKeywords: ["growth", "ROI", "automation"],
};

describe("AgencyContext", () => {
  it("creates a valid context", () => {
    const ctx = AgencyContext.create("ctx-1", BASE);
    expect(ctx.sector).toBe("SaaS");
    expect(ctx.targetAudience).toBe("Marketing managers in mid-sized companies");
    expect(ctx.toneOfVoice).toBe("Professional and empathetic");
    expect(ctx.brandKeywords).toEqual(["growth", "ROI", "automation"]);
    expect(ctx.additionalContext).toBeNull();
    expect(ctx.agencyId).toBe("agency-1");
    expect(ctx.updatedAt).toBeInstanceOf(Date);
  });

  it("trims whitespace from string fields", () => {
    const ctx = AgencyContext.create("ctx-1", {
      ...BASE,
      sector: "  E-commerce  ",
      targetAudience: "  SMBs  ",
      toneOfVoice: "  Friendly  ",
    });
    expect(ctx.sector).toBe("E-commerce");
    expect(ctx.targetAudience).toBe("SMBs");
    expect(ctx.toneOfVoice).toBe("Friendly");
  });

  it("filters empty brand keywords", () => {
    const ctx = AgencyContext.create("ctx-1", {
      ...BASE,
      brandKeywords: ["growth", "  ", "", "ROI"],
    });
    expect(ctx.brandKeywords).toEqual(["growth", "ROI"]);
  });

  it("stores additionalContext when provided", () => {
    const ctx = AgencyContext.create("ctx-1", {
      ...BASE,
      additionalContext: "We target French-speaking markets",
    });
    expect(ctx.additionalContext).toBe("We target French-speaking markets");
  });

  it("sets additionalContext to null when empty string", () => {
    const ctx = AgencyContext.create("ctx-1", { ...BASE, additionalContext: "   " });
    expect(ctx.additionalContext).toBeNull();
  });

  it("throws when sector is empty", () => {
    expect(() => AgencyContext.create("ctx-1", { ...BASE, sector: "" })).toThrow(DomainError);
  });

  it("throws when sector exceeds 200 chars", () => {
    expect(() => AgencyContext.create("ctx-1", { ...BASE, sector: "a".repeat(201) })).toThrow(
      DomainError,
    );
  });

  it("throws when targetAudience is empty", () => {
    expect(() => AgencyContext.create("ctx-1", { ...BASE, targetAudience: "" })).toThrow(
      DomainError,
    );
  });

  it("throws when toneOfVoice is empty", () => {
    expect(() => AgencyContext.create("ctx-1", { ...BASE, toneOfVoice: "" })).toThrow(DomainError);
  });

  it("reconstitutes from persistence", () => {
    const date = new Date("2024-06-01");
    const ctx = AgencyContext.reconstitute("ctx-1", {
      ...BASE,
      additionalContext: null,
      updatedAt: date,
    });
    expect(ctx.id).toBe("ctx-1");
    expect(ctx.updatedAt).toBe(date);
  });

  it("can update fields", () => {
    const ctx = AgencyContext.create("ctx-1", BASE);
    ctx.update({ sector: "Legal services", brandKeywords: ["compliance", "regulation"] });
    expect(ctx.sector).toBe("Legal services");
    expect(ctx.brandKeywords).toEqual(["compliance", "regulation"]);
    expect(ctx.targetAudience).toBe(BASE.targetAudience);
  });

  it("builds correct prompt string", () => {
    const ctx = AgencyContext.create("ctx-1", BASE);
    const prompt = ctx.toPromptString();
    expect(prompt).toContain("Industry/Sector: SaaS");
    expect(prompt).toContain("Target Audience: Marketing managers in mid-sized companies");
    expect(prompt).toContain("Tone of Voice: Professional and empathetic");
    expect(prompt).toContain("Brand Keywords: growth, ROI, automation");
  });

  it("omits brand keywords line when empty", () => {
    const ctx = AgencyContext.create("ctx-1", { ...BASE, brandKeywords: [] });
    expect(ctx.toPromptString()).not.toContain("Brand Keywords");
  });
});
