import { ContentType } from "@/modules/content/domain/value-objects/content-type.vo";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { describe, expect, it } from "vitest";

describe("ContentType", () => {
  it("creates all valid types", () => {
    expect(ContentType.create("ARTICLE").value).toBe("ARTICLE");
    expect(ContentType.create("PRODUCT_SHEET").value).toBe("PRODUCT_SHEET");
    expect(ContentType.create("META").value).toBe("META");
    expect(ContentType.create("LINKEDIN_POST").value).toBe("LINKEDIN_POST");
    expect(ContentType.create("FACEBOOK_POST").value).toBe("FACEBOOK_POST");
  });

  it("throws on invalid type", () => {
    expect(() => ContentType.create("BLOG")).toThrow(DomainError);
    expect(() => ContentType.create("INSTAGRAM_POST")).toThrow(DomainError);
    expect(() => ContentType.create("")).toThrow(DomainError);
  });

  it("static instances match expected values", () => {
    expect(ContentType.ARTICLE.value).toBe("ARTICLE");
    expect(ContentType.PRODUCT_SHEET.value).toBe("PRODUCT_SHEET");
    expect(ContentType.META.value).toBe("META");
    expect(ContentType.LINKEDIN_POST.value).toBe("LINKEDIN_POST");
    expect(ContentType.FACEBOOK_POST.value).toBe("FACEBOOK_POST");
  });
});
