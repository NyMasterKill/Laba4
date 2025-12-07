import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastBookingEndedAtToUser implements MigrationInterface {
  name = 'AddLastBookingEndedAtToUser';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN last_booking_ended_at TIMESTAMP WITH TIME ZONE NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN last_booking_ended_at;
    `);
  }
}