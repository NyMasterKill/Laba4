import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFinesTable1733670093000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем таблицу fines
    await queryRunner.createTable(new Table({
      name: 'fines',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid',
        },
        {
          name: 'type',
          type: 'enum',
          enum: ['station_return_violation', 'vehicle_damage', 'late_return', 'other'],
          isNullable: false,
        },
        {
          name: 'amount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: false,
        },
        {
          name: 'status',
          type: 'enum',
          enum: ['pending', 'paid', 'cancelled'],
          default: "'pending'",
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'due_date',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamptz',
          default: 'now()',
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
          default: 'now()',
        },
        {
          name: 'user_id',
          type: 'uuid',
          isNullable: false,
        },
      ],
    }), true);

    // Добавляем внешний ключ для user_id
    await queryRunner.createForeignKey('fines', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fines');
    const foreignKeys = table.foreignKeys;
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('fines', fk);
    }
    await queryRunner.dropTable('fines');
  }
}