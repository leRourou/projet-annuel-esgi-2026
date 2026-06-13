import { CurationStatus } from "@/modules/rss/domain/value-objects/curation-status.vo";
import { describe, expect, it } from "vitest";

describe("CurationStatus", () => {
  it("creates from valid values", () => {
    for (const v of ["UNREAD", "INTERESTING", "IGNORED", "TO_USE"]) {
      expect(CurationStatus.create(v).value).toBe(v);
    }
  });

  it("throws on invalid value", () => {
    expect(() => CurationStatus.create("INVALID")).toThrow("Invalid curation status");
  });

  it("defaults to UNREAD", () => {
    expect(CurationStatus.unread().value).toBe("UNREAD");
  });

  it("equals compares by value", () => {
    const a = CurationStatus.create("INTERESTING");
    const b = CurationStatus.create("INTERESTING");
    const c = CurationStatus.create("IGNORED");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
