import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Миграция, которая создает полную структуру БД на основе всех сущностей
 * Используется для инициализации новой БД или для обновления структуры
 * В реальной практике, обычно используют генератор миграций TypeORM
 * npx typeorm migration:generate -d ./src/config/typeorm.config.ts src/migrations/AwesomeMigration
 */
export class GenerateDbSchema1703126400004 implements MigrationInterface {
    name = 'GenerateDbSchema1703126400004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Сначала создаем ENUM типы
        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS vehicle_type_enum AS ENUM('bicycle', 'scooter');
        `);
        
        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS vehicle_status_enum AS ENUM('available', 'reserved', 'in_ride', 'maintenance', 'out_of_service');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS booking_status_enum AS ENUM('active', 'cancelled', 'used', 'expired');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS ride_status_enum AS ENUM('in_progress', 'completed', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS payment_status_enum AS ENUM('pending', 'completed', 'failed', 'refunded');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS payment_method_enum AS ENUM('t_bank', 'card', 'subscription');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS fine_type_enum AS ENUM('wrong_station_return', 'vehicle_damage', 'overdue_return', 'other');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS fine_status_enum AS ENUM('pending', 'paid', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS subscription_status_enum AS ENUM('active', 'inactive', 'expired', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS maintenance_type_enum AS ENUM('routine', 'repair', 'inspection', 'other');
        `);

        await queryRunner.query(`
            CREATE TYPE IF NOT EXISTS maintenance_status_enum AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');
        `);

        // Создаем таблицы в правильном порядке (учитывая зависимости)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "roles" (
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
            CREATE TABLE IF NOT EXISTS "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "gosuslugi_id" character varying NOT NULL,
                "phone" character varying,
                "is_active" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_gosuslugi_id" UNIQUE ("gosuslugi_id"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "first_name" character varying(100) NOT NULL,
                "last_name" character varying(100) NOT NULL,
                "middle_name" character varying(100),
                "birth_date" date NOT NULL,
                "passport_number" character varying(10) NOT NULL,
                "address" json,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                CONSTRAINT "UQ_profiles_passport_number" UNIQUE ("passport_number"),
                CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "gosuslugi_bindings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "gosuslugi_id" character varying NOT NULL,
                "external_user_id" character varying NOT NULL,
                "email" character varying,
                "phone" character varying,
                "is_verified" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                CONSTRAINT "UQ_gosuslugi_bindings_gosuslugi_id" UNIQUE ("gosuslugi_id"),
                CONSTRAINT "PK_gosuslugi_bindings_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_gosuslugi_bindings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "stations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(200) NOT NULL,
                "description" character varying(500),
                "lat" double precision NOT NULL,
                "lng" double precision NOT NULL,
                "capacity" integer NOT NULL DEFAULT 0,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_stations_id" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "vehicles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" vehicle_type_enum NOT NULL,
                "model" character varying(100) NOT NULL,
                "serial_number" character varying(50) NOT NULL,
                "battery_level" numeric(5, 2) NOT NULL DEFAULT 100,
                "price_per_minute" numeric(8, 2) NOT NULL,
                "current_lat" double precision,
                "current_lng" double precision,
                "status" vehicle_status_enum NOT NULL DEFAULT 'available',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "station_id" uuid,
                CONSTRAINT "UQ_vehicles_serial_number" UNIQUE ("serial_number"),
                CONSTRAINT "PK_vehicles_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_vehicles_station_id" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tariff_plans" (
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
            CREATE TABLE IF NOT EXISTS "bookings" (
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
                CONSTRAINT "FK_bookings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_bookings_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "rides" (
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
                CONSTRAINT "FK_rides_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_rides_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "FK_rides_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payments" (
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
                CONSTRAINT "FK_payments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "fines" (
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
                CONSTRAINT "FK_fines_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "subscriptions" (
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
                CONSTRAINT "FK_subscriptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_subscriptions_tariff_plan_id" FOREIGN KEY ("tariff_plan_id") REFERENCES "tariff_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "employees" (
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
                CONSTRAINT "FK_employees_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "maintenance_logs" (
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
                CONSTRAINT "FK_maintenance_logs_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_maintenance_logs_performed_by" FOREIGN KEY ("performed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
        `);

        // Создаем индексы для улучшения производительности
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_gosuslugi_id" ON "users"("gosuslugi_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_profiles_user_id" ON "profiles"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_gosuslugi_bindings_user_id" ON "gosuslugi_bindings"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_vehicles_station_id" ON "vehicles"("station_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_bookings_user_id" ON "bookings"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_bookings_vehicle_id" ON "bookings"("vehicle_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_rides_user_id" ON "rides"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_rides_vehicle_id" ON "rides"("vehicle_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_rides_booking_id" ON "rides"("booking_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_payments_user_id" ON "payments"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_fines_user_id" ON "fines"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_subscriptions_user_id" ON "subscriptions"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_subscriptions_tariff_plan_id" ON "subscriptions"("tariff_plan_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_maintenance_logs_vehicle_id" ON "maintenance_logs"("vehicle_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_maintenance_logs_performed_by" ON "maintenance_logs"("performed_by");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_employees_role_id" ON "employees"("role_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем индексы
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_gosuslugi_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profiles_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gosuslugi_bindings_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicles_station_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_vehicle_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rides_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rides_vehicle_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rides_booking_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fines_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_tariff_plan_id"`);
        await queryRunner.query(`DROP INDEX IF NOT EXISTS "IDX_maintenance_logs_vehicle_id"`);
        await queryRunner.query(`DROP INDEX IF NOT EXISTS "IDX_maintenance_logs_performed_by"`);
        await queryRunner.query(`DROP INDEX IF NOT EXISTS "IDX_employees_role_id"`);

        // Удаляем таблицы в обратном порядке (учитывая зависимости)
        await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "fines"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "rides"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tariff_plans"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "vehicles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stations"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "gosuslugi_bindings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);

        // Удаляем ENUM типы
        await queryRunner.query(`DROP TYPE IF EXISTS "maintenance_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "maintenance_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "subscription_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "fine_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "fine_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "ride_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "vehicle_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "vehicle_type_enum"`);
    }
}