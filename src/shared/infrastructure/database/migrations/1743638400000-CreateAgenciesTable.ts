import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAgenciesTable1743638400000 implements MigrationInterface {
  name = "CreateAgenciesTable1743638400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "agencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_agencies_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_agencies" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "agencies"`);
  }
}
