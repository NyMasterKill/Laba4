import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './Profile';
import { GosuslugiBinding } from './GosuslugiBinding';
import { Booking } from './Booking';
import { Ride } from './Ride';
import { Payment } from './Payment';
import { Fine } from './Fine';
import { Subscription } from './Subscription';
import { UserSession } from './UserSession';
import { VerificationCode } from './VerificationCode';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  gosuslugi_id: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  phone: string;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true }) // Добавляем новое поле
  last_booking_ended_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @OneToOne(() => GosuslugiBinding, (binding) => binding.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  gosuslugi_binding: GosuslugiBinding;

  @OneToMany(() => Booking, (booking) => booking.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  bookings: Booking[];

  @OneToMany(() => Ride, (ride) => ride.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  rides: Ride[];

  @OneToMany(() => Payment, (payment) => payment.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  payments: Payment[];

  @OneToMany(() => Fine, (fine) => fine.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  fines: Fine[];

  @OneToMany(() => Subscription, (subscription) => subscription.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  subscriptions: Subscription[];

  @OneToMany(() => UserSession, (session) => session.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  sessions: UserSession[];

  @OneToMany(() => VerificationCode, (verificationCode) => verificationCode.user, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  verificationCodes: VerificationCode[];
}