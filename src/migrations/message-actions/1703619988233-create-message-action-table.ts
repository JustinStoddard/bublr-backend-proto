import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMessageActionTable1703619988233 implements MigrationInterface {
  name = 'CreateMessageActionTable1703619988233'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
    `CREATE TABLE "message_actions" (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      user_id text not null,
      message_id text not null,
      action_type text not null
    )
    `);
  };

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DROP TABLE "message_actions"
      `
    )
  };
};