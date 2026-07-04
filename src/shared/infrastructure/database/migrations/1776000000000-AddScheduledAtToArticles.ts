import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduledAtToArticles1776000000000 implements MigrationInterface {
  name = "AddScheduledAtToArticles1776000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" ADD "scheduled_at" TIMESTAMP`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "scheduled_at"`);
  }
}
