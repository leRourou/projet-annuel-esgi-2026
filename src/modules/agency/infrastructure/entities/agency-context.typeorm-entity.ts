import { preserveEntityName } from "@/shared/infrastructure/database/preserve-entity-name";
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AgencyTypeormEntity } from "./agency.typeorm-entity";

@Entity("agency_contexts")
export class AgencyContextTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "agency_id", unique: true })
  agencyId!: string;

  @Column({ type: "varchar" })
  sector!: string;

  @Column({ type: "varchar", name: "target_audience" })
  targetAudience!: string;

  @Column({ type: "varchar", name: "tone_of_voice" })
  toneOfVoice!: string;

  @Column({ type: "simple-array", name: "brand_keywords" })
  brandKeywords!: string[];

  @Column({ type: "text", name: "additional_context", nullable: true })
  additionalContext!: string | null;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  @OneToOne(() => AgencyTypeormEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "agency_id" })
  agency!: AgencyTypeormEntity;
}
preserveEntityName(AgencyContextTypeormEntity, "AgencyContextTypeormEntity");
