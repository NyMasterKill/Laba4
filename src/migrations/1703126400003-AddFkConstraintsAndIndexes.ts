import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFkConstraintsAndIndexes1703126400003 implements MigrationInterface {
    name = 'AddFkConstraintsAndIndexes1703126400003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Добавим уникальное ограничение на поле gosuslugi_id в таблице users
        // (уже есть в сущности, но можно добавить явно в миграции)
        await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "UQ_users_gosuslugi_id" UNIQUE ("gosuslugi_id");
        `);

        // Создадим индексы для улучшения производительности
        await queryRunner.query(`
            CREATE INDEX "IDX_users_gosuslugi_id" ON "users"("gosuslugi_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_profiles_user_id" ON "profiles"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_gosuslugi_bindings_user_id" ON "gosuslugi_bindings"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_vehicles_station_id" ON "vehicles"("station_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bookings_user_id" ON "bookings"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bookings_vehicle_id" ON "bookings"("vehicle_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_rides_user_id" ON "rides"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_rides_vehicle_id" ON "rides"("vehicle_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_rides_booking_id" ON "rides"("booking_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_payments_user_id" ON "payments"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_fines_user_id" ON "fines"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions"("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_subscriptions_tariff_plan_id" ON "subscriptions"("tariff_plan_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_maintenance_logs_vehicle_id" ON "maintenance_logs"("vehicle_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_maintenance_logs_performed_by" ON "maintenance_logs"("performed_by");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_employees_role_id" ON "employees"("role_id");
        `);

        // Добавим ещё одно уникальное ограничение на phone в users
        await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "UQ_users_phone" UNIQUE ("phone");
        `);

        // Добавим ограничение, чтобы phone не мог быть NULL если необязательное
        await queryRunner.query(`
            ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
        `);

        // Проверим, что все внешние ключи установлены правильно
        // Проверим, что в таблице profiles есть ограничение на user_id
        await queryRunner.query(`
            ALTER TABLE "profiles" ADD CONSTRAINT "FK_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        // Обновим ограничение в таблице gosuslugi_bindings
        await queryRunner.query(`
            ALTER TABLE "gosuslugi_bindings" ADD CONSTRAINT "FK_gosuslugi_bindings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        // Обновим ограничение в таблице vehicles
        await queryRunner.query(`
            ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_station_id" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        // Обновим ограничения в таблице bookings
        await queryRunner.query(`
            ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `);

        // Обновим ограничения в таблице rides
        await queryRunner.query(`
            ALTER TABLE "rides" ADD CONSTRAINT "FK_rides_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "rides" ADD CONSTRAINT "FK_rides_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "rides" ADD CONSTRAINT "FK_rides_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        // Обновим ограничения в таблице payments
        await queryRunner.query(`
            ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        // Обновим ограничения в таблице fines
        await queryRunner.query(`
            ALTER TABLE "fines" ADD CONSTRAINT "FK_fines_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        // Обновим ограничения в таблице subscriptions
        await queryRunner.query(`
            ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_tariff_plan_id" FOREIGN KEY ("tariff_plan_id") REFERENCES "tariff_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `);

        // Обновим ограничения в таблице maintenance_logs
        await queryRunner.query(`
            ALTER TABLE "maintenance_logs" ADD CONSTRAINT "FK_maintenance_logs_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "maintenance_logs" ADD CONSTRAINT "FK_maintenance_logs_performed_by" FOREIGN KEY ("performed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        // Обновим ограничения в таблице employees
        await queryRunner.query(`
            ALTER TABLE "employees" ADD CONSTRAINT "FK_employees_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удалим индексы
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
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_maintenance_logs_vehicle_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_maintenance_logs_performed_by"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_role_id"`);

        // Удалим уникальные ограничения
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_gosuslugi_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_phone"`);

        // Удалим внешние ключи
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "FK_profiles_user_id"`);
        await queryRunner.query(`ALTER TABLE "gosuslugi_bindings" DROP CONSTRAINT IF EXISTS "FK_gosuslugi_bindings_user_id"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "FK_vehicles_station_id"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "FK_bookings_user_id"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "FK_bookings_vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "rides" DROP CONSTRAINT IF EXISTS "FK_rides_user_id"`);
        await queryRunner.query(`ALTER TABLE "rides" DROP CONSTRAINT IF EXISTS "FK_rides_vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "rides" DROP CONSTRAINT IF EXISTS "FK_rides_booking_id"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_user_id"`);
        await queryRunner.query(`ALTER TABLE "fines" DROP CONSTRAINT IF EXISTS "FK_fines_user_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_user_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_tariff_plan_id"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP CONSTRAINT IF EXISTS "FK_maintenance_logs_vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP CONSTRAINT IF EXISTS "FK_maintenance_logs_performed_by"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "FK_employees_role_id"`);
    }
}