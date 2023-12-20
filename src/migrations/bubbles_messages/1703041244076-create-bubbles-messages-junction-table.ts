import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBubblesMessagesJunctionTable1703041244076 implements MigrationInterface {
  name = 'CreateBubblesMessagesJunctionTable1703041244076';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bubbles_messages" (
        "bubbleId" uuid NOT NULL,
        "messageId" uuid NOT NULL,
        CONSTRAINT "PK_bubbles_messages" PRIMARY KEY ("bubbleId", "messageId")
      )`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_bubbleId" ON "bubbles_messages" ("bubbleId")`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_messageId" ON "bubbles_messages" ("messageId")`
    );

    await queryRunner.query(
      `ALTER TABLE "bubbles_messages"
        ADD CONSTRAINT "FK_bubbleId" FOREIGN KEY ("bubbleId") REFERENCES "bubbles"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );

    await queryRunner.query(
      `ALTER TABLE "bubbles_messages"
        ADD CONSTRAINT "FK_messageId" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bubbles_messages" DROP CONSTRAINT "FK_bubbleId"`);
    await queryRunner.query(`ALTER TABLE "bubbles_messages" DROP CONSTRAINT "FK_messageId"`);
    await queryRunner.query(`DROP INDEX "IDX_bubbleId"`);
    await queryRunner.query(`DROP INDEX "IDX_messageId"`);
    await queryRunner.query(`DROP TABLE "bubbles_messages"`);
  }
}