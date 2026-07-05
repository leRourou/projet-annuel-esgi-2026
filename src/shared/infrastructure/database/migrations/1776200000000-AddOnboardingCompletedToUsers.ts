import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnboardingCompletedToUsers1776200000000 implements MigrationInterface {
  name = "AddOnboardingCompletedToUsers1776200000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "onboarding_completed" boolean NOT NULL DEFAULT false`,
    );
    // Backfill: users who already belong to an agency have effectively already
    // onboarded — don't force them back through the wizard.
    await queryRunner.query(`
      UPDATE "users" SET "onboarding_completed" = true
      WHERE id::text IN (SELECT DISTINCT user_id FROM agency_members WHERE joined_at IS NOT NULL)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboarding_completed"`);
  }
}
