import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddThemesTable1775400000000 implements MigrationInterface {
  name = "AddThemesTable1775400000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "themes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "agency_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_themes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_themes_agency" FOREIGN KEY ("agency_id")
          REFERENCES "agencies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_themes_agency_id" ON "themes" ("agency_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_themes_agency_id"`);
    await queryRunner.query(`DROP TABLE "themes"`);
  }
}
