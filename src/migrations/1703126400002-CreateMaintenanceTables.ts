import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMaintenanceTables1703126400002 implements MigrationInterface {
    name = 'CreateMaintenanceTables1703126400002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE maintenance_type_enum AS ENUM('routine', 'repair', 'inspection', 'other');
        `);

        await queryRunner.query(`
            CREATE TYPE maintenance_status_enum AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(50) NOT NULL,
                "description" text,
                "permissions" json,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
                CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "employees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "first_name" character varying(100) NOT NULL,
                "last_name" character varying(100) NOT NULL,
                "middle_name" character varying(100),
                "employee_code" character varying NOT NULL,
                "email" character varying NOT NULL,
                "phone" character varying NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "role_id" uuid,
                CONSTRAINT "UQ_employees_employee_code" UNIQUE ("employee_code"),
                CONSTRAINT "UQ_employees_email" UNIQUE ("email"),
                CONSTRAINT "PK_employees_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_employees_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "maintenance_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" maintenance_type_enum NOT NULL,
                "status" maintenance_status_enum NOT NULL DEFAULT 'scheduled',
                "description" text NOT NULL,
                "scheduled_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "started_at" TIMESTAMP WITH TIME ZONE,
                "completed_at" TIMESTAMP WITH TIME ZONE,
                "duration" integer,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "vehicle_id" uuid,
                "performed_by" uuid,
                CONSTRAINT "PK_maintenance_logs_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_maintenance_logs_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_maintenance_logs_performed_by" FOREIGN KEY ("performed_by") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "maintenance_logs"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TYPE "maintenance_status_enum"`);
        await queryRunner.query(`DROP TYPE "maintenance_type_enum"`);
    }
}