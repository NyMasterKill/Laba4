import { getRepository } from "typeorm";
import { SupportTicket, TicketStatus } from "../entities/SupportTicket";
import { Message, MessageType } from "../entities/Message";
import { User } from "../entities/User";

export class SupportTicketService {
  static async createTicket(userId: string, title: string, description: string): Promise<SupportTicket> {
    const ticket = new SupportTicket();
    ticket.title = title;
    ticket.description = description;
    ticket.user_id = userId;
    ticket.status = TicketStatus.OPEN;

    return await getRepository(SupportTicket).save(ticket);
  }

  static async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    return await getRepository(SupportTicket)
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender')
      .where('ticket.id = :ticketId', { ticketId })
      .getOne();
  }

  static async getUserTickets(userId: string): Promise<SupportTicket[]> {
    return await getRepository(SupportTicket)
      .createQueryBuilder('ticket')
      .where('ticket.user_id = :userId', { userId })
      .orderBy('ticket.created_at', 'DESC')
      .getMany();
  }

  static async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
    const ticket = await getRepository(SupportTicket).findOneBy({ id: ticketId });
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    ticket.status = status;
    return await getRepository(SupportTicket).save(ticket);
  }

  static async getAllTickets(): Promise<SupportTicket[]> {
    return await getRepository(SupportTicket)
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .orderBy('ticket.created_at', 'DESC')
      .getMany();
  }
}