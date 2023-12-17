import { MigrationInterface, QueryRunner } from "typeorm";

export class Messages1702786695580 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE messages (
        id uuid primary key default gen_random_uuid(),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        deleted_at timestamptz,
        owner_id text not null,
        parent_bubble_id text not null,
        content text not null,
        likes integer not null default 0,
        dislikes integer not null default 0,
        reports integer not null default 0
      )
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE messages
      `
    )
  }
}