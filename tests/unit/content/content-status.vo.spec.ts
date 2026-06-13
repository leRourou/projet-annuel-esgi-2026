import { ContentStatus } from "@/modules/content/domain/value-objects/content-status.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

describe("ContentStatus", () => {
  it("creates valid statuses", () => {
    expect(ContentStatus.create("DRAFT").value).toBe("DRAFT");
    expect(ContentStatus.create("REVIEW").value).toBe("REVIEW");
    expect(ContentStatus.create("VALIDATED").value).toBe("VALIDATED");
    expect(ContentStatus.create("SCHEDULED").value).toBe("SCHEDULED");
    expect(ContentStatus.create("PUBLISHED").value).toBe("PUBLISHED");
  });

  it("throws on invalid status", () => {
    expect(() => ContentStatus.create("ARCHIVED")).toThrow(DomainError);
    expect(() => ContentStatus.create("")).toThrow(DomainError);
  });

  describe("transitions", () => {
    it("DRAFT → REVIEW is valid", () => {
      expect(ContentStatus.DRAFT.canTransitionTo(ContentStatus.REVIEW)).toBe(true);
    });

    it("DRAFT → PUBLISHED is invalid", () => {
      expect(ContentStatus.DRAFT.canTransitionTo(ContentStatus.PUBLISHED)).toBe(false);
    });

    it("DRAFT → VALIDATED is invalid", () => {
      expect(ContentStatus.DRAFT.canTransitionTo(ContentStatus.VALIDATED)).toBe(false);
    });

    it("REVIEW → DRAFT is valid", () => {
      expect(ContentStatus.REVIEW.canTransitionTo(ContentStatus.DRAFT)).toBe(true);
    });

    it("REVIEW → VALIDATED is valid", () => {
      expect(ContentStatus.REVIEW.canTransitionTo(ContentStatus.VALIDATED)).toBe(true);
    });

    it("REVIEW → PUBLISHED is invalid", () => {
      expect(ContentStatus.REVIEW.canTransitionTo(ContentStatus.PUBLISHED)).toBe(false);
    });

    it("VALIDATED → SCHEDULED is valid", () => {
      expect(ContentStatus.VALIDATED.canTransitionTo(ContentStatus.SCHEDULED)).toBe(true);
    });

    it("VALIDATED → PUBLISHED is valid", () => {
      expect(ContentStatus.VALIDATED.canTransitionTo(ContentStatus.PUBLISHED)).toBe(true);
    });

    it("VALIDATED → DRAFT is invalid", () => {
      expect(ContentStatus.VALIDATED.canTransitionTo(ContentStatus.DRAFT)).toBe(false);
    });

    it("SCHEDULED → PUBLISHED is valid", () => {
      expect(ContentStatus.SCHEDULED.canTransitionTo(ContentStatus.PUBLISHED)).toBe(true);
    });

    it("SCHEDULED → DRAFT is invalid", () => {
      expect(ContentStatus.SCHEDULED.canTransitionTo(ContentStatus.DRAFT)).toBe(false);
    });

    it("PUBLISHED → anything is invalid", () => {
      expect(ContentStatus.PUBLISHED.canTransitionTo(ContentStatus.DRAFT)).toBe(false);
      expect(ContentStatus.PUBLISHED.canTransitionTo(ContentStatus.REVIEW)).toBe(false);
      expect(ContentStatus.PUBLISHED.canTransitionTo(ContentStatus.VALIDATED)).toBe(false);
      expect(ContentStatus.PUBLISHED.canTransitionTo(ContentStatus.SCHEDULED)).toBe(false);
    });
  });
});
