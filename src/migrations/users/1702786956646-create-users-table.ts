import { MigrationInterface, QueryRunner } from "typeorm";

export class Users1702786956646 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE users (
        id uuid primary key default gen_random_uuid(),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        deleted_at timestamptz,
        display_name text not null,
        handle text not null,
        email text not null,
        password text not null,
        account_type text not null
      )
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE users
      `
    )
  }
}