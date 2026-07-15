import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { preserveEntityName } from "@/shared/infrastructure/database/preserve-entity-name";

@Entity("accounts")
@Index(["provider", "providerAccountId"], { unique: true })
export class AccountTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar" })
  type!: string;

  @Column({ type: "varchar" })
  provider!: string;

  @Column({ type: "varchar", name: "provider_account_id" })
  providerAccountId!: string;

  @Column({ type: "varchar", name: "refresh_token", nullable: true })
  refresh_token!: string | null;

  @Column({ type: "text", name: "access_token", nullable: true })
  access_token!: string | null;

  @Column({ type: "bigint", name: "expires_at", nullable: true })
  expires_at!: number | null;

  @Column({ type: "varchar", name: "token_type", nullable: true })
  token_type!: string | null;

  @Column({ type: "varchar", nullable: true })
  scope!: string | null;

  @Column({ type: "text", name: "id_token", nullable: true })
  id_token!: string | null;

  @Column({ type: "varchar", name: "session_state", nullable: true })
  session_state!: string | null;
}
preserveEntityName(AccountTypeormEntity, "AccountTypeormEntity");
