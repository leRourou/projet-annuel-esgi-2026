import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthTables1775228738204 implements MigrationInterface {
  name = "AddAuthTables1775228738204";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agency_members" DROP CONSTRAINT "FK_agency_members_agency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_members" DROP CONSTRAINT "FK_agency_members_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_agency_members_agency_user"`);
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying NOT NULL, "provider" character varying NOT NULL, "provider_account_id" character varying NOT NULL, "refresh_token" character varying, "access_token" text, "expires_at" bigint, "token_type" character varying, "scope" character varying, "id_token" text, "session_state" character varying, CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_06f1ce45cbf093e57b82420556" ON "accounts" ("provider", "provider_account_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "verification_tokens" ("identifier" character varying NOT NULL, "token" character varying NOT NULL, "expires" TIMESTAMP NOT NULL, CONSTRAINT "PK_8e338f6e5b12ee0e24e59ed93d2" PRIMARY KEY ("identifier", "token"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "email_verified" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "agency_members" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "agency_members" ADD "user_id" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "agency_members" DROP COLUMN "invited_by"`);
    await queryRunner.query(
      `ALTER TABLE "agency_members" ADD "invited_by" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "keywords"`);
    await queryRunner.query(`ALTER TABLE "articles" ADD "keywords" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "feeds" ADD CONSTRAINT "PK_3dafbf766ecbb1eb2017732153f" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_members" ADD CONSTRAINT "FK_82e84f1f0f8e0b064de85b99627" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agency_members" DROP CONSTRAINT "FK_82e84f1f0f8e0b064de85b99627"`,
    );
    await queryRunner.query(`ALTER TABLE "feeds" DROP CONSTRAINT "PK_3dafbf766ecbb1eb2017732153f"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "keywords"`);
    await queryRunner.query(`ALTER TABLE "articles" ADD "keywords" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "agency_members" DROP COLUMN "invited_by"`);
    await queryRunner.query(`ALTER TABLE "agency_members" ADD "invited_by" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "agency_members" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "agency_members" ADD "user_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_06f1ce45cbf093e57b82420556"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_agency_members_agency_user" ON "agency_members" ("agency_id", "user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_members" ADD CONSTRAINT "FK_agency_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_members" ADD CONSTRAINT "FK_agency_members_agency" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
