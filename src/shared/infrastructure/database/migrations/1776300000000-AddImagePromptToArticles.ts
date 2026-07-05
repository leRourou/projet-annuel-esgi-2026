import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddImagePromptToArticles1776300000000 implements MigrationInterface {
  name = "AddImagePromptToArticles1776300000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" ADD "image_prompt" text`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "image_prompt"`);
  }
}
