import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  TableInheritance,
} from 'typeorm';
import { Station } from './Station';
import { Booking } from './Booking';
import { Ride } from './Ride';
import { MaintenanceLog } from './MaintenanceLog';

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
@TableInheritance({ column: { name: 'type', type: 'varchar' } })
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: () => "'vehicle'" })
  type: string;

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

  @ManyToOne(() => Station, (station) => station.vehicles, {
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'station_id' })
  station: Station;

  @OneToMany(() => Booking, (booking) => booking.vehicle, {
    cascade: true
  })
  bookings: Booking[];

  @OneToMany(() => Ride, (ride) => ride.vehicle, {
    cascade: true
  })
  rides: Ride[];

  @OneToMany(() => MaintenanceLog, (log) => log.vehicle, {
    cascade: true
  })
  maintenance_logs: MaintenanceLog[];
}