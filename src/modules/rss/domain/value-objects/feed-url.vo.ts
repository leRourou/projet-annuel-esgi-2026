import { ValueObject } from "@/shared/domain/base/value-object.base";
import { DomainError } from "@/shared/domain/errors/domain.error";

interface FeedUrlProps {
  readonly value: string;
}

export class FeedUrl extends ValueObject<FeedUrlProps> {
  private constructor(props: FeedUrlProps) {
    super(props);
  }

  static create(raw: string): FeedUrl {
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Protocol must be http or https");
      }
      return new FeedUrl({ value: url.toString() });
    } catch {
      throw new DomainError(`"${raw}" is not a valid feed URL`, "INVALID_FEED_URL");
    }
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
