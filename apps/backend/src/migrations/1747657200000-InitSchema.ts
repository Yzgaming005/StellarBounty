import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1747657200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TYPE bounty_status_enum AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
      CREATE TYPE submission_status_enum AS ENUM ('pending', 'approved', 'rejected');

      CREATE TABLE bounties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        "rewardAmount" BIGINT NOT NULL,
        deadline TIMESTAMPTZ,
        status bounty_status_enum NOT NULL DEFAULT 'open',
        "ownerAddress" VARCHAR NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bountyId" UUID NOT NULL,
        "contributorAddress" VARCHAR NOT NULL,
        link VARCHAR NOT NULL,
        notes TEXT,
        status submission_status_enum NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_4246a6a27949b2a73cfc65800fb" FOREIGN KEY ("bountyId") REFERENCES bounties(id) ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS submissions;
      DROP TABLE IF EXISTS bounties;
      DROP TYPE IF EXISTS submission_status_enum;
      DROP TYPE IF EXISTS bounty_status_enum;
    `);
  }
}
