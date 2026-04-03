import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1743000000000 implements MigrationInterface {
  name = "InitialSchema1743000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'MEMBER',
        "notion_access_token" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

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

    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "content_type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'DRAFT',
        "meta_title" character varying NOT NULL,
        "meta_description" character varying NOT NULL,
        "keywords" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "author_id" character varying NOT NULL,
        "agency_id" character varying,
        "notion_page_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_articles_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_articles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "feeds" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "url" character varying NOT NULL,
        "owner_id" character varying NOT NULL,
        "agency_id" character varying,
        "last_fetched_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "feed_items" (
        "id" character varying NOT NULL,
        "feed_id" character varying NOT NULL,
        "title" character varying NOT NULL,
        "link" character varying NOT NULL,
        "summary" text NOT NULL,
        "published_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_feed_items" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feed_items"`);
    await queryRunner.query(`DROP TABLE "feeds"`);
    await queryRunner.query(`DROP TABLE "articles"`);
    await queryRunner.query(`DROP INDEX "IDX_agency_members_agency_user"`);
    await queryRunner.query(`DROP TABLE "agency_members"`);
    await queryRunner.query(`DROP TABLE "agencies"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
