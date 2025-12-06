import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Vehicle } from './Vehicle';
import { Ride } from './Ride';

export enum BookingStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.ACTIVE,
  })
  status: BookingStatus;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date; // время истечения бронирования

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_cost: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.bookings, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.bookings, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @OneToMany(() => Ride, (ride) => ride.booking, {
    cascade: true
  })
  rides: Ride[];
}