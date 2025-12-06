import {
  Entity,
  Column,
} from 'typeorm';
import { Vehicle } from './Vehicle';

@Entity()
export class Scooter extends Vehicle {
  @Column({ type: 'int', nullable: true })
  max_speed_kmh: number; // максимальная скорость в км/ч

  @Column({ type: 'int', nullable: true })
  max_range_km: number; // максимальная дальность в км

  @Column({ type: 'int', nullable: true })
  max_power_w: number; // максимальная мощность в ваттах

  constructor() {
    super();
    this.type = 'scooter'; // Устанавливаем тип при создании
  }
}