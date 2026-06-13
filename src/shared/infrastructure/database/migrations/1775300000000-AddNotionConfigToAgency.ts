import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotionConfigToAgency1775300000000 implements MigrationInterface {
  name = "AddNotionConfigToAgency1775300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD COLUMN "notion_access_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD COLUMN "notion_database_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "notion_database_id"`);
    await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "notion_access_token"`);
  }
}
