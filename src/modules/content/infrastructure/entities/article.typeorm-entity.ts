import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { preserveEntityName } from "@/shared/infrastructure/database/preserve-entity-name";

@Entity("articles")
export class ArticleTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column("text")
  body!: string;

  @Column({ type: "varchar", name: "content_type" })
  contentType!: string;

  @Column({ type: "varchar", default: "DRAFT" })
  status!: string;

  @Column({ type: "varchar", name: "meta_title" })
  metaTitle!: string;

  @Column({ type: "varchar", name: "meta_description" })
  metaDescription!: string;

  @Column("simple-array")
  keywords!: string[];

  @Column({ type: "varchar", unique: true })
  slug!: string;

  @Column({ type: "varchar", nullable: true })
  excerpt!: string | null;

  @Column({ type: "varchar", name: "author_id" })
  authorId!: string;

  @Column({ type: "varchar", name: "agency_id", nullable: true })
  agencyId!: string | null;

  @Column({ type: "varchar", name: "notion_page_id", nullable: true })
  notionPageId!: string | null;

  @Column({ type: "timestamp", name: "scheduled_at", nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: "text", name: "image_prompt", nullable: true })
  imagePrompt!: string | null;

  @Column({ type: "timestamp", name: "published_at", nullable: true })
  publishedAt!: Date | null;

  @Column({ type: "timestamp", name: "body_purged_at", nullable: true })
  bodyPurgedAt!: Date | null;

  @Column({ type: "text", array: true, name: "tag_ids", default: "{}" })
  tagIds!: string[];

  @Column({ type: "text", array: true, name: "source_ids", default: "{}" })
  sourceIds!: string[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
preserveEntityName(ArticleTypeormEntity, "ArticleTypeormEntity");
