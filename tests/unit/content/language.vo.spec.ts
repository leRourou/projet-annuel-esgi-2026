import { Language } from "@/modules/content/domain/value-objects/language.vo";
import { describe, expect, it } from "vitest";

describe("Language", () => {
  it("creates from valid values", () => {
    for (const v of ["FR", "EN"]) {
      expect(Language.create(v).value).toBe(v);
    }
  });

  it("throws on invalid value", () => {
    expect(() => Language.create("DE")).toThrow("Invalid language");
  });

  it("defaults to FR", () => {
    expect(Language.default().value).toBe("FR");
  });

  it("equals compares by value", () => {
    const a = Language.create("EN");
    const b = Language.create("EN");
    const c = Language.create("FR");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
