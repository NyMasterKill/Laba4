import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSupportTables1733672400000 implements MigrationInterface {
    name = 'CreateSupportTables1733672400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Создаем таблицу support_tickets
        await queryRunner.query(`
            CREATE TABLE "support_tickets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'open',
                "user_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                CONSTRAINT "PK_support_tickets_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_support_tickets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);

        // Создаем индекс для user_id в support_tickets
        await queryRunner.query(`
            CREATE INDEX "IDX_support_tickets_user_id" ON "support_tickets"("user_id");
        `);

        // Создаем индекс для status в support_tickets
        await queryRunner.query(`
            CREATE INDEX "IDX_support_tickets_status" ON "support_tickets"("status");
        `);

        // Создаем таблицу messages
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" text NOT NULL,
                "type" character varying(20) NOT NULL,
                "ticket_id" uuid NOT NULL,
                "sender_id" uuid NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_messages_ticket_id" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_messages_sender_id" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);

        // Создаем индекс для ticket_id в messages
        await queryRunner.query(`
            CREATE INDEX "IDX_messages_ticket_id" ON "messages"("ticket_id");
        `);

        // Создаем индекс для sender_id в messages
        await queryRunner.query(`
            CREATE INDEX "IDX_messages_sender_id" ON "messages"("sender_id");
        `);

        // Создаем индекс для типа сообщения
        await queryRunner.query(`
            CREATE INDEX "IDX_messages_type" ON "messages"("type");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем индекс для типа сообщения
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_type";`);

        // Удаляем индекс для sender_id
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sender_id";`);

        // Удаляем индекс для ticket_id
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_ticket_id";`);

        // Удаляем таблицу messages
        await queryRunner.query(`DROP TABLE IF EXISTS "messages";`);

        // Удаляем индекс для status
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_status";`);

        // Удаляем индекс для user_id
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_user_id";`);

        // Удаляем таблицу support_tickets
        await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets";`);
    }
}