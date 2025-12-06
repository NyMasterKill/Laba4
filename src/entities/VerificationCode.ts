import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum VerificationType {
  SMS = 'sms',
  EMAIL = 'email',
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_AUTH = 'two_factor_auth'
}

@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  type: VerificationType;

  @Column({ unique: true })
  @Index()
  destination: string; // телефон или email

  @Column()
  code: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.verificationCodes)
  @JoinColumn({ name: 'user_id' })
  user: User;
}