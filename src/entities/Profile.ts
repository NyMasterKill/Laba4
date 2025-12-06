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

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middle_name: string;

  @Column({ type: 'date' })
  birth_date: Date;

  @Column({ type: 'varchar', length: 10, unique: true })
  passport_number: string;

  @Column({ type: 'simple-json', nullable: true })
  address: {
    country: string;
    region: string;
    city: string;
    street: string;
    house: string;
    apartment: string;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.profile, {
    onDelete: 'CASCADE'
  })
  user: User;
}