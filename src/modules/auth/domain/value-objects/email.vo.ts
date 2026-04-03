import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

interface EmailProps {
  readonly value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();
    if (!Email.EMAIL_REGEX.test(trimmed)) {
      throw new DomainError(`"${raw}" is not a valid email address`, "INVALID_EMAIL");
    }
    return new Email({ value: trimmed });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
