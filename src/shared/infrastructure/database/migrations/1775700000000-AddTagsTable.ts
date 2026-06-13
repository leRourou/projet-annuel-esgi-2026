import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagsTable1775700000000 implements MigrationInterface {
  name = "AddTagsTable1775700000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "agency_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tags_agency" FOREIGN KEY ("agency_id")
          REFERENCES "agencies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tags_agency_id" ON "tags" ("agency_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "articles" ADD COLUMN "tag_ids" text[] NOT NULL DEFAULT '{}'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tag_ids"`);
    await queryRunner.query(`DROP INDEX "IDX_tags_agency_id"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
