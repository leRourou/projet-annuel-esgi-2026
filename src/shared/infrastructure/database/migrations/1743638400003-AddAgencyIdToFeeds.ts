import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgencyIdToFeeds1743638400003 implements MigrationInterface {
  name = "AddAgencyIdToFeeds1743638400003";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feeds"
        ADD COLUMN "agency_id" uuid,
        ADD CONSTRAINT "FK_feeds_agency" FOREIGN KEY ("agency_id")
          REFERENCES "agencies"("id") ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feeds"
        DROP CONSTRAINT "FK_feeds_agency",
        DROP COLUMN "agency_id"
    `);
  }
}
