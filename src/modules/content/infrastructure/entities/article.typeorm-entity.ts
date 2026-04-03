import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("articles")
export class ArticleTypeormEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column("text")
  body!: string;

  @Column({ name: "content_type" })
  contentType!: string;

  @Column({ default: "DRAFT" })
  status!: string;

  @Column({ name: "meta_title" })
  metaTitle!: string;

  @Column({ name: "meta_description" })
  metaDescription!: string;

  @Column("simple-array")
  keywords!: string[];

  @Column({ unique: true })
  slug!: string;

  @Column({ name: "author_id" })
  authorId!: string;

  @Column({ name: "notion_page_id", nullable: true })
  notionPageId!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
