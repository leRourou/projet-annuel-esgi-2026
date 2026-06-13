import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceIdsToArticles1775900000000 implements MigrationInterface {
  name = "AddSourceIdsToArticles1775900000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "source_ids" text[] NOT NULL DEFAULT '{}'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles"
        DROP COLUMN "source_ids"
    `);
  }
}
