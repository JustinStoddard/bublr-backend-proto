import { MigrationInterface, QueryRunner } from "typeorm";

export class Bubbles1702786164045 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE bubbles (
        id uuid primary key default gen_random_uuid(),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        deleted_at timestamptz,
        owner_id text not null,
        name text not null,
        longitude float not null,
        latitude float not null,
        radius float not null
      )
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE bubbles
      `
    )
  }
}