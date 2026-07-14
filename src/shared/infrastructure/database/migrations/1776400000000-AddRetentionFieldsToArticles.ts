import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRetentionFieldsToArticles1776400000000 implements MigrationInterface {
  name = "AddRetentionFieldsToArticles1776400000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" ADD "published_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "articles" ADD "body_purged_at" timestamp`);
    // Backfill: approximate publishedAt with updatedAt for articles already published,
    // so the 30-day retention window starts counting instead of never triggering.
    await queryRunner.query(
      `UPDATE "articles" SET "published_at" = "updated_at" WHERE "status" = 'PUBLISHED' AND "published_at" IS NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "body_purged_at"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "published_at"`);
  }
}
