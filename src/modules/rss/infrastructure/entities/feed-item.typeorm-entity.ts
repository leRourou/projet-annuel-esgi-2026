import { preserveEntityName } from "@/shared/infrastructure/database/preserve-entity-name";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("feed_items")
export class FeedItemTypeormEntity {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar", name: "feed_id" })
  feedId!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar" })
  link!: string;

  @Column("text")
  summary!: string;

  @Column({ type: "timestamp", name: "published_at" })
  publishedAt!: Date;

  @Column({ type: "varchar", name: "curation_status", default: "UNREAD" })
  curationStatus!: string;

  @Column({ type: "text", array: true, name: "tag_ids", default: "{}" })
  tagIds!: string[];
}
preserveEntityName(FeedItemTypeormEntity, "FeedItemTypeormEntity");
