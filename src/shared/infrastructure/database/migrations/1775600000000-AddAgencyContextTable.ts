import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgencyContextTable1775600000000 implements MigrationInterface {
  name = "AddAgencyContextTable1775600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "agency_contexts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "sector" character varying NOT NULL,
        "target_audience" character varying NOT NULL,
        "tone_of_voice" character varying NOT NULL,
        "brand_keywords" text NOT NULL DEFAULT '',
        "additional_context" text,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agency_contexts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_agency_contexts_agency_id" UNIQUE ("agency_id"),
        CONSTRAINT "FK_agency_contexts_agency" FOREIGN KEY ("agency_id")
          REFERENCES "agencies"("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "agency_contexts"`);
  }
}
