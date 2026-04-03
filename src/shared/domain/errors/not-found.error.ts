import { DomainError } from "./domain.error";

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}
