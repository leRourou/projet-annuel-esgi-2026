import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("feed_items")
export class FeedItemTypeormEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ name: "feed_id" })
  feedId!: string;

  @Column()
  title!: string;

  @Column()
  link!: string;

  @Column("text")
  summary!: string;

  @Column({ name: "published_at" })
  publishedAt!: Date;
}
