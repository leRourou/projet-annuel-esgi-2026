import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurationStatusToFeedItems1775800000000 implements MigrationInterface {
  name = "AddCurationStatusToFeedItems1775800000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feed_items"
        ADD COLUMN "curation_status" character varying NOT NULL DEFAULT 'UNREAD',
        ADD COLUMN "tag_ids" text[] NOT NULL DEFAULT '{}'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feed_items"
        DROP COLUMN "curation_status",
        DROP COLUMN "tag_ids"
    `);
  }
}
