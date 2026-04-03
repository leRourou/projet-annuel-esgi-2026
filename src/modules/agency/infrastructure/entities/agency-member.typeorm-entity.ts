import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AgencyTypeormEntity } from "./agency.typeorm-entity";

@Entity("agency_members")
export class AgencyMemberTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "agency_id" })
  agencyId!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @Column({ default: "MEMBER" })
  role!: string;

  @Column({ name: "joined_at", nullable: true })
  joinedAt!: Date | null;

  @Column({ name: "invited_by" })
  invitedBy!: string;

  @Column({ name: "invite_token", nullable: true, unique: true })
  inviteToken!: string | null;

  @Column({ name: "invite_expires_at", nullable: true })
  inviteExpiresAt!: Date | null;

  @ManyToOne(
    () => AgencyTypeormEntity,
    (agency) => agency.members,
  )
  @JoinColumn({ name: "agency_id" })
  agency!: AgencyTypeormEntity;
}
