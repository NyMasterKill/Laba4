import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';
import { User } from './User';

export enum FineType {
  STATION_RETURN_VIOLATION = 'station_return_violation',
  VEHICLE_DAMAGE = 'vehicle_damage',
  LATE_RETURN = 'late_return',
  OTHER = 'other',
}

export enum FineStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('fines')
export class Fine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FineType,
  })
  type: FineType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: FineStatus,
    default: FineStatus.PENDING,
  })
  status: FineStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.fines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  user_id: string;
}