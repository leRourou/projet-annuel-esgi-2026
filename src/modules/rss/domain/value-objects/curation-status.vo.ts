import { DomainError } from "@/shared/domain/errors/domain.error";

export const CURATION_STATUSES = ["UNREAD", "INTERESTING", "IGNORED", "TO_USE"] as const;
export type CurationStatusValue = (typeof CURATION_STATUSES)[number];

export class CurationStatus {
  private constructor(private readonly _value: CurationStatusValue) {
    Object.freeze(this);
  }

  static create(value: string): CurationStatus {
    if (!CURATION_STATUSES.includes(value as CurationStatusValue)) {
      throw new DomainError(
        `Invalid curation status: ${value}. Must be one of: ${CURATION_STATUSES.join(", ")}`,
        "INVALID_CURATION_STATUS",
      );
    }
    return new CurationStatus(value as CurationStatusValue);
  }

  static unread(): CurationStatus {
    return new CurationStatus("UNREAD");
  }

  get value(): CurationStatusValue {
    return this._value;
  }

  equals(other: CurationStatus): boolean {
    return this._value === other._value;
  }
}
