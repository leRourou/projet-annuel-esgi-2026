import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgencyIdToArticles1743638400002 implements MigrationInterface {
  name = "AddAgencyIdToArticles1743638400002";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "agency_id" uuid,
        ADD CONSTRAINT "FK_articles_agency" FOREIGN KEY ("agency_id")
          REFERENCES "agencies"("id") ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles"
        DROP CONSTRAINT "FK_articles_agency",
        DROP COLUMN "agency_id"
    `);
  }
}
