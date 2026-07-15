import { Column, Entity, PrimaryColumn } from "typeorm";
import { preserveEntityName } from "@/shared/infrastructure/database/preserve-entity-name";

@Entity("verification_tokens")
export class VerificationTokenTypeormEntity {
  @PrimaryColumn({ type: "varchar" })
  identifier!: string;

  @PrimaryColumn({ type: "varchar" })
  token!: string;

  @Column({ type: "timestamp" })
  expires!: Date;
}
preserveEntityName(VerificationTokenTypeormEntity, "VerificationTokenTypeormEntity");
