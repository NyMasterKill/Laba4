import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Station } from './Station';

export enum VehicleType {
  BICYCLE = 'bicycle',
  SCOOTER = 'scooter',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  IN_RIDE = 'in_ride',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
  })
  type: VehicleType;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  serial_number: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 }) // percentage
  battery_level: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  price_per_minute: number;

  @Column({ type: 'float', precision: 53, nullable: true })
  current_lat: number;

  @Column({ type: 'float', precision: 53, nullable: true })
  current_lng: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Station, (station) => station.vehicles)
  @JoinColumn({ name: 'station_id' })
  station: Station;
}