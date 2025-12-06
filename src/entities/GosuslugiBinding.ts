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

@Entity('gosuslugi_bindings')
export class GosuslugiBinding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  gosuslugi_id: string;

  @Column({ type: 'varchar' })
  external_user_id: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.gosuslugi_binding, {
    onDelete: 'CASCADE'
  })
  user: User;
}