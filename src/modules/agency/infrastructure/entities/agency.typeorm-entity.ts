import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AgencyMemberTypeormEntity } from "./agency-member.typeorm-entity";

@Entity("agencies")
export class AgencyTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(
    () => AgencyMemberTypeormEntity,
    (member) => member.agency,
  )
  members!: AgencyMemberTypeormEntity[];
}
