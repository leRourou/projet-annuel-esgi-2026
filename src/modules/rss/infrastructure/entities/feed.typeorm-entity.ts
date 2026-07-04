import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("feeds")
export class FeedTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  url!: string;

  @Column({ type: "varchar", name: "owner_id" })
  ownerId!: string;

  @Column({ type: "varchar", name: "agency_id", nullable: true })
  agencyId!: string | null;

  @Column({ type: "timestamp", name: "last_fetched_at", nullable: true })
  lastFetchedAt!: Date | null;

  @Column({ type: "varchar", name: "source_type", default: "RSS" })
  sourceType!: string;

  @Column({ type: "varchar", name: "notion_database_id", nullable: true })
  notionDatabaseId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;
}
