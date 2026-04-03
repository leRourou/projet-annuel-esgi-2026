import { DomainError } from "@/shared/domain/errors/domain.error";

export class AgencyNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Agency "${id}" not found`, "AGENCY_NOT_FOUND");
  }
}

export class MemberAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`A member with email "${email}" already belongs to this agency`, "MEMBER_ALREADY_EXISTS");
  }
}

export class InsufficientPermissionsError extends DomainError {
  constructor() {
    super("You do not have permission to perform this action", "INSUFFICIENT_PERMISSIONS");
  }
}

export class InvalidInviteTokenError extends DomainError {
  constructor() {
    super("The invitation token is invalid or has expired", "INVALID_INVITE_TOKEN");
  }
}

export class MemberNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`Member "${userId}" not found in this agency`, "MEMBER_NOT_FOUND");
  }
}
