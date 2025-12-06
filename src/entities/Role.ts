import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './Employee';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string; // например: admin, mechanic, dispatcher, etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true }) // права в формате JSON
  permissions: {
    can_manage_vehicles: boolean;
    can_manage_users: boolean;
    can_view_reports: boolean;
    can_manage_maintenance: boolean;
    can_manage_finances: boolean;
    [key: string]: boolean;
  };

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Employee, (employee) => employee.role, {
    cascade: true
  })
  employees: Employee[];
}