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

export enum FineType {
  WRONG_STATION_RETURN = 'wrong_station_return',
  VEHICLE_DAMAGE = 'vehicle_damage',
  OVERDUE_RETURN = 'overdue_return',
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

  @Column({ type: 'timestamptz', nullable: true })
  due_date: Date; // срок оплаты

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.fines, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}