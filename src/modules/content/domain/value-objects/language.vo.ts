import { DomainError } from "@/shared/domain/errors/domain.error";

export const LANGUAGES = ["FR", "EN"] as const;
export type LanguageValue = (typeof LANGUAGES)[number];

export class Language {
  private constructor(private readonly _value: LanguageValue) {
    Object.freeze(this);
  }

  static create(value: string): Language {
    if (!LANGUAGES.includes(value as LanguageValue)) {
      throw new DomainError(
        `Invalid language: ${value}. Must be one of: ${LANGUAGES.join(", ")}`,
        "INVALID_LANGUAGE",
      );
    }
    return new Language(value as LanguageValue);
  }

  static default(): Language {
    return new Language("FR");
  }

  get value(): LanguageValue {
    return this._value;
  }

  equals(other: Language): boolean {
    return this._value === other._value;
  }
}
