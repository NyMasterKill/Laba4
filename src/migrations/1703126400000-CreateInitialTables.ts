import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1703126400000 implements MigrationInterface {
    name = 'CreateInitialTables1703126400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE vehicle_type_enum AS ENUM('bicycle', 'scooter');
        `);
        
        await queryRunner.query(`
            CREATE TYPE vehicle_status_enum AS ENUM('available', 'reserved', 'in_ride', 'maintenance', 'out_of_service');
        `);

        await queryRunner.query(`
            CREATE TABLE "users" (
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
            CREATE TABLE "profiles" (
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
                CONSTRAINT "FK_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "gosuslugi_bindings" (
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
                CONSTRAINT "FK_gosuslugi_bindings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "stations" (
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
            CREATE TABLE "vehicles" (
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
                CONSTRAINT "FK_vehicles_station_id" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "stations"`);
        await queryRunner.query(`DROP TABLE "gosuslugi_bindings"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "vehicle_status_enum"`);
        await queryRunner.query(`DROP TYPE "vehicle_type_enum"`);
    }
}