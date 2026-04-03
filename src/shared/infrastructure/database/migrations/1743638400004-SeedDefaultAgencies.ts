import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration de données : pour chaque utilisateur existant, crée une agence par défaut,
 * l'inscrit comme ADMIN, et rattache ses articles et feeds à cette agence.
 */
export class SeedDefaultAgencies1743638400004 implements MigrationInterface {
  name = "SeedDefaultAgencies1743638400004";

  async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.query(`SELECT id, name FROM "users"`);

    for (const user of users as { id: string; name: string }[]) {
      const slug =
        user.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50) || "agency";

      const uniqueSlug = `${slug}-${user.id.slice(0, 8)}`;

      await queryRunner.query(
        `INSERT INTO "agencies" ("id", "name", "slug")
         VALUES (uuid_generate_v4(), $1, $2)`,
        [`${user.name}'s Agency`, uniqueSlug],
      );

      const [agency] = await queryRunner.query(`SELECT id FROM "agencies" WHERE slug = $1`, [
        uniqueSlug,
      ]);

      await queryRunner.query(
        `INSERT INTO "agency_members" ("id", "agency_id", "user_id", "role", "joined_at", "invited_by")
         VALUES (uuid_generate_v4(), $1, $2, 'ADMIN', now(), $2)`,
        [agency.id, user.id],
      );

      await queryRunner.query(`UPDATE "articles" SET "agency_id" = $1 WHERE "author_id" = $2`, [
        agency.id,
        user.id,
      ]);

      await queryRunner.query(`UPDATE "feeds" SET "agency_id" = $1 WHERE "owner_id" = $2`, [
        agency.id,
        user.id,
      ]);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "articles" SET "agency_id" = NULL`);
    await queryRunner.query(`UPDATE "feeds" SET "agency_id" = NULL`);
    await queryRunner.query(`DELETE FROM "agency_members"`);
    await queryRunner.query(`DELETE FROM "agencies"`);
  }
}
