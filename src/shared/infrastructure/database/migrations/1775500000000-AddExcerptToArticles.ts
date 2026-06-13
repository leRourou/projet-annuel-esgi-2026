import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddExcerptToArticles1775500000000 implements MigrationInterface {
  name = "AddExcerptToArticles1775500000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles"
      ADD COLUMN IF NOT EXISTS "excerpt" character varying NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles" DROP COLUMN IF EXISTS "excerpt"
    `);
  }
}
