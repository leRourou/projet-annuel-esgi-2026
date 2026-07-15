import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { preserveEntityName } from "@/shared/infrastructure/database/preserve-entity-name";
import { AgencyTypeormEntity } from "./agency.typeorm-entity";

@Entity("themes")
export class ThemeTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "uuid", name: "agency_id" })
  agencyId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @ManyToOne(() => AgencyTypeormEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "agency_id" })
  agency!: AgencyTypeormEntity;
}
preserveEntityName(ThemeTypeormEntity, "ThemeTypeormEntity");
