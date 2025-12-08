import { getRepository } from "typeorm";
import { Message, MessageType } from "../entities/Message";
import { SupportTicket } from "../entities/SupportTicket";

export class MessageService {
  static async createMessage(
    ticketId: string,
    content: string,
    type: MessageType,
    senderId?: string
  ): Promise<Message> {
    // Проверяем, существует ли тикет
    const ticket = await getRepository(SupportTicket).findOneBy({ id: ticketId });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const message = new Message();
    message.content = content;
    message.type = type;
    message.ticket_id = ticketId;
    if (senderId) {
      message.sender_id = senderId;
    }

    return await getRepository(Message).save(message);
  }

  static async getMessagesByTicket(ticketId: string): Promise<Message[]> {
    return await getRepository(Message)
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.ticket_id = :ticketId', { ticketId })
      .orderBy('message.created_at', 'ASC')
      .getMany();
  }

  static async updateTicketStatusAfterMessage(ticketId: string, message: string): Promise<void> {
    // Простая логика - если пользователь прислал сообщение, статус тикета становится "in_progress"
    // если поддержка прислала сообщение, статус тикета становится "in_progress" (если не "closed" или "resolved")
    if (message.toLowerCase().includes('closed') || message.toLowerCase().includes('решен')) {
      // В реальном приложении была бы более сложная логика
    }
  }
}