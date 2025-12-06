import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Vehicle } from './Vehicle';
import { Booking } from './Booking';

export enum RideStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RideStatus,
    default: RideStatus.IN_PROGRESS,
  })
  status: RideStatus;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_time: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distance: number; // in kilometers

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_cost: number;

  @Column({ type: 'float', precision: 53, nullable: true })
  start_lat: number;

  @Column({ type: 'float', precision: 53, nullable: true })
  start_lng: number;

  @Column({ type: 'float', precision: 53, nullable: true })
  end_lat: number;

  @Column({ type: 'float', precision: 53, nullable: true })
  end_lng: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.rides, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.rides, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => Booking, (booking) => booking.rides, {
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}