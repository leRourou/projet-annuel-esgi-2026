import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("feeds")
export class FeedTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  url!: string;

  @Column({ name: "owner_id" })
  ownerId!: string;

  @Column({ name: "last_fetched_at", nullable: true })
  lastFetchedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
