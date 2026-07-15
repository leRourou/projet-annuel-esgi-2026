import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { preserveEntityName } from "@/shared/infrastructure/database/preserve-entity-name";
import type { AgencyTypeormEntity } from "./agency.typeorm-entity";

@Entity("agency_members")
export class AgencyMemberTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "agency_id" })
  agencyId!: string;

  @Column({ type: "varchar", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", default: "MEMBER" })
  role!: string;

  @Column({ type: "timestamp", name: "joined_at", nullable: true })
  joinedAt!: Date | null;

  @Column({ type: "varchar", name: "invited_by" })
  invitedBy!: string;

  @Column({ type: "varchar", name: "invite_token", nullable: true, unique: true })
  inviteToken!: string | null;

  @Column({ type: "timestamp", name: "invite_expires_at", nullable: true })
  inviteExpiresAt!: Date | null;

  @ManyToOne(
    // biome-ignore lint/suspicious/noExplicitAny: defer require to break circular import
    (): any => require("./agency.typeorm-entity").AgencyTypeormEntity,
    (agency: AgencyTypeormEntity) => agency.members,
  )
  @JoinColumn({ name: "agency_id" })
  agency!: AgencyTypeormEntity;
}
preserveEntityName(AgencyMemberTypeormEntity, "AgencyMemberTypeormEntity");
