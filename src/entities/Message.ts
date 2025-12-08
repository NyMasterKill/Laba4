import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SupportTicket } from './SupportTicket';
import { User } from './User';

export enum MessageType {
  USER = 'user',
  SUPPORT = 'support',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  type: MessageType;

  @Column({ type: 'uuid' })
  ticket_id: string;

  @Column({ type: 'uuid', nullable: true })
  sender_id?: string; // Может быть пустым для системных сообщений

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages)
  @JoinColumn({ name: 'ticket_id' })
  ticket: SupportTicket;

  @ManyToOne(() => User, { nullable: true }) // nullable для системных сообщений
  @JoinColumn({ name: 'sender_id' })
  sender?: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}