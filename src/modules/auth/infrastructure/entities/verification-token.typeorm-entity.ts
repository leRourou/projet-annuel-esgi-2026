import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("verification_tokens")
export class VerificationTokenTypeormEntity {
  @PrimaryColumn({ type: "varchar" })
  identifier!: string;

  @PrimaryColumn({ type: "varchar" })
  token!: string;

  @Column({ type: "timestamp" })
  expires!: Date;
}
