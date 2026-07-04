import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceTypeToFeeds1776100000000 implements MigrationInterface {
  name = "AddSourceTypeToFeeds1776100000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feeds" ADD "source_type" varchar NOT NULL DEFAULT 'RSS'`);
    await queryRunner.query(`ALTER TABLE "feeds" ADD "notion_database_id" varchar`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feeds" DROP COLUMN "notion_database_id"`);
    await queryRunner.query(`ALTER TABLE "feeds" DROP COLUMN "source_type"`);
  }
}
