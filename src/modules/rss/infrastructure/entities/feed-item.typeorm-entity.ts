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
}
