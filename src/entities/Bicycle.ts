import {
  Entity,
  Column,
} from 'typeorm';
import { Vehicle } from './Vehicle';

@Entity()
export class Bicycle extends Vehicle {
  @Column({ type: 'int', nullable: true })
  gear_count: number;

  @Column({ type: 'int', nullable: true })
  max_load_kg: number; // максимальная нагрузка в кг

  constructor() {
    super();
    this.type = 'bicycle'; // Устанавливаем тип при создании
  }
}