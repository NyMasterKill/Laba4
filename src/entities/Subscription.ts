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
import { TariffPlan } from './TariffPlan';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz' })
  end_date: Date;

  @Column({ type: 'int', default: 0 })
  used_minutes: number; // использовано минут по подписке

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.subscriptions, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => TariffPlan, (tariffPlan) => tariffPlan.subscriptions, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'tariff_plan_id' })
  tariff_plan: TariffPlan;
}