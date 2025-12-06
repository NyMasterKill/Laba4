import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdditionalTables1703126400001 implements MigrationInterface {
    name = 'CreateAdditionalTables1703126400001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE booking_status_enum AS ENUM('active', 'cancelled', 'used', 'expired');
        `);

        await queryRunner.query(`
            CREATE TYPE ride_status_enum AS ENUM('in_progress', 'completed', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TYPE payment_status_enum AS ENUM('pending', 'completed', 'failed', 'refunded');
        `);

        await queryRunner.query(`
            CREATE TYPE payment_method_enum AS ENUM('t_bank', 'card', 'subscription');
        `);

        await queryRunner.query(`
            CREATE TYPE fine_type_enum AS ENUM('wrong_station_return', 'vehicle_damage', 'overdue_return', 'other');
        `);

        await queryRunner.query(`
            CREATE TYPE fine_status_enum AS ENUM('pending', 'paid', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TYPE subscription_status_enum AS ENUM('active', 'inactive', 'expired', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TABLE "tariff_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "price" numeric(10, 2) NOT NULL,
                "free_minutes" integer,
                "is_active" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tariff_plans_id" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" booking_status_enum NOT NULL DEFAULT 'active',
                "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
                "total_cost" numeric(10, 2),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                "vehicle_id" uuid,
                CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_bookings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_bookings_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "rides" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" ride_status_enum NOT NULL DEFAULT 'in_progress',
                "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_time" TIMESTAMP WITH TIME ZONE,
                "distance" numeric(8, 2),
                "total_cost" numeric(10, 2),
                "start_lat" double precision,
                "start_lng" double precision,
                "end_lat" double precision,
                "end_lng" double precision,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                "vehicle_id" uuid,
                "booking_id" uuid,
                CONSTRAINT "PK_rides_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_rides_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_rides_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_rides_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "amount" numeric(10, 2) NOT NULL,
                "status" payment_status_enum NOT NULL DEFAULT 'pending',
                "method" payment_method_enum NOT NULL,
                "transaction_id" character varying,
                "description" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_payments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "fines" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" fine_type_enum NOT NULL,
                "amount" numeric(10, 2) NOT NULL,
                "status" fine_status_enum NOT NULL DEFAULT 'pending',
                "description" text,
                "due_date" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                CONSTRAINT "PK_fines_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_fines_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" subscription_status_enum NOT NULL DEFAULT 'active',
                "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "used_minutes" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                "tariff_plan_id" uuid,
                CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_subscriptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_subscriptions_tariff_plan_id" FOREIGN KEY ("tariff_plan_id") REFERENCES "tariff_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "fines"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "rides"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TABLE "tariff_plans"`);
        await queryRunner.query(`DROP TYPE "subscription_status_enum"`);
        await queryRunner.query(`DROP TYPE "fine_status_enum"`);
        await queryRunner.query(`DROP TYPE "fine_type_enum"`);
        await queryRunner.query(`DROP TYPE "payment_method_enum"`);
        await queryRunner.query(`DROP TYPE "payment_status_enum"`);
        await queryRunner.query(`DROP TYPE "ride_status_enum"`);
        await queryRunner.query(`DROP TYPE "booking_status_enum"`);
    }
}