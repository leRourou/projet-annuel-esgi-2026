import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAgencyMembersTable1743638400001 implements MigrationInterface {
  name = "CreateAgencyMembersTable1743638400001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "agency_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying NOT NULL DEFAULT 'MEMBER',
        "joined_at" TIMESTAMP,
        "invited_by" uuid NOT NULL,
        "invite_token" character varying,
        "invite_expires_at" TIMESTAMP,
        CONSTRAINT "UQ_agency_members_invite_token" UNIQUE ("invite_token"),
        CONSTRAINT "PK_agency_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agency_members_agency" FOREIGN KEY ("agency_id")
          REFERENCES "agencies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_agency_members_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_agency_members_agency_user"
        ON "agency_members" ("agency_id", "user_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "agency_members"`);
  }
}
